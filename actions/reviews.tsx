"use server"

import db from "@/db"
import { review, Review, FullReview } from "@/db/models/reviews"
import { product, productSizeVariant } from "@/db/models/product"
import { user } from "@/db/models/user"
import { CLogger } from "@/lib/logger"
import { cacheManager } from "@/lib/redis"
import { APIResponse, PaginatedAPIResponse } from "@/types/api"
import { desc, eq, and, ilike, sql, count, avg, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

// ────────────────────────────────────────────────
// 1. Submit review (authenticated user + lock per user)
// ────────────────────────────────────────────────
export async function submitReview(params: {
	productSizeVariantId: string
	rating: number
	comment?: string
}): Promise<APIResponse<null>> {
	const session = await auth.api.getSession()
	if (!session?.user) {
		return {
			success: false,
			message: "Authentication required",
			error_code: "UNAUTHORIZED",
            timestamp: new Date(),
		}
	}

	if (params.rating < 1 || params.rating > 5) {
		return {
			success: false,
			message: "Rating must be 1–5",
			error_code: "VALIDATION_ERROR",
            timestamp: new Date(),
		}
	}

	const lockResource = `review:submit:${session.user.id}`

	return await cacheManager.withLock(
		lockResource,
		async () => {
			try {
				await db.insert(review).values({
					userId: session.user.id,
					rating: params.rating,
					comment: params.comment,
					approved: false,
				})

				await cacheManager.invalidateByTag("reviews_average")
				revalidatePath("/dashboard/reviews")
				revalidatePath("/") // if shown publicly

				return {
					success: true,
					message: "Review submitted — awaiting approval",
					timestamp: new Date(),
				}
			} catch (err) {
				CLogger.error("Review submission failed", { error: err })
				return {
					success: false,
					message: "Submission failed",
					error_code: "SUBMISSION_ERROR",
                    timestamp: new Date(),
				}
			}
		},
		8000,
		4,
	) // 8s lock, 4 retries
}

// ────────────────────────────────────────────────
// 2. Get reviews — paginated (admin/staff only, cached)
// ────────────────────────────────────────────────
export async function getReviews(params: {
	cursor?: string
	limit?: number
	search?: string
}): Promise<PaginatedAPIResponse<FullReview>> {
	const session = await auth.api.getSession()
	if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
		return {
			success: false,
			message: "Admin/Staff required",
			error_code: "UNAUTHORIZED",
            timestamp: new Date(),
		}
	}

	const limitVal = params.limit ?? 20
	const search = params.search?.trim().toLowerCase() ?? ""
	const cacheKey = `admin:reviews:list:cursor:${params.cursor ?? "head"}:limit:${limitVal}:q:${search || "none"}`

	try {
		const cached =
			await cacheManager.get<PaginatedAPIResponse<FullReview>>(cacheKey)
		if (cached) {
			return cached
		}

		const filters = []

		if (search) {
			filters.push(
				or(
					ilike(product.name, `%${search}%`),
					ilike(review.comment, `%${search}%`),
					ilike(user.name, `%${search}%`),
				),
			)
		}

		if (params.cursor) {
			const cursorDate = new Date(params.cursor)
			if (!isNaN(cursorDate.getTime())) {
				filters.push(sql`${review.createdAt} < ${cursorDate}`)
			}
		}

		const results = await db.query.review.findMany({
			where: filters.length > 0 ? and(...filters) : undefined,
			with: {
				user: true 
            },
			orderBy: [desc(review.createdAt)],
			limit: limitVal + 1,
		})

		const hasMore = results.length > limitVal
		const records = hasMore ? results.slice(0, limitVal) : results

		let nextCursor: string | undefined = undefined
		if (hasMore && records.length > 0) {
			nextCursor = records[records.length - 1].createdAt.toISOString()
		}

		const paginatedResponse = {
			success: true,
			message: "Reviews fetched",
			data: {
				records,
				pagination: { 
                    nextCursor, 
                    prevCursor: params.cursor, 
                    hasMore 
                },
			},
			timestamp: new Date(),
		}

		const ttl = search ? 300 : 1800
		await cacheManager.set(cacheKey, paginatedResponse, ttl, [
			"reviews_list",
			"admin_reviews",
			"reviews",
		])

		return paginatedResponse
	} catch (err) {
		CLogger.error("Reviews fetch failed", { error: err })
		return {
			success: false,
			message: "Fetch failed",
			error_code: "FETCH_ERROR",
            timestamp: new Date(),
		}
	}
}

// ────────────────────────────────────────────────
// 3. Delete review (admin/staff only + lock per review)
// ────────────────────────────────────────────────
export async function deleteReview(
	reviewId: string,
): Promise<APIResponse<null>> {
	const session = await auth.api.getSession()
	if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
		return {
			success: false,
			message: "Admin/Staff required",
			error_code: "UNAUTHORIZED",
            timestamp: new Date(),
		}
	}

	const lockResource = `review:mutate:${reviewId}`

	return await cacheManager.withLock(
		lockResource,
		async () => {
			try {
				await db.delete(review).where(eq(review.id, reviewId))

				await cacheManager.invalidateByTag("reviews_list")
				await cacheManager.invalidateByTag("reviews_average")

				revalidatePath("/dashboard/reviews")

				return {
					success: true,
					message: "Review deleted",
					timestamp: new Date(),
				}
			} catch (err) {
				CLogger.error("Review deletion failed", { error: err })
				return {
					success: false,
					message: "Deletion failed",
					error_code: "DELETION_ERROR",
                    timestamp: new Date(),
				}
			}
		},
		10000,
		5,
	)
}

// ────────────────────────────────────────────────
// 4. Approve / Reject review (admin only + lock per review)
// ────────────────────────────────────────────────
export async function approveReview(
	reviewId: string,
): Promise<APIResponse<null>> {
	const session = await auth.api.getSession()
	if (!session?.user?.isAdmin) {
		return {
			success: false,
			message: "Admin required",
			error_code: "UNAUTHORIZED",
            timestamp: new Date(),
		}
	}

	const lockResource = `review:mutate:${reviewId}`

	return await cacheManager.withLock(
		lockResource,
		async () => {
			try {
				await db
					.update(review)
					.set({ approved: true })
					.where(eq(review.id, reviewId))

				await cacheManager.invalidateByTag("reviews_average")
				await cacheManager.invalidateByTag("reviews_list")

				revalidatePath("/dashboard/reviews")

				return {
					success: true,
					message: "Review approved",
					timestamp: new Date(),
				}
			} catch (err) {
				CLogger.error("Review approval failed", { error: err })
				return {
					success: false,
					message: "Approval failed",
					error_code: "APPROVAL_ERROR",
                    timestamp: new Date(),
				}
			}
		},
		10000,
		5,
	)
}

export async function rejectReview(
	reviewId: string,
): Promise<APIResponse<null>> {
	const session = await auth.api.getSession()
	if (!session?.user?.isAdmin) {
		return {
			success: false,
			message: "Admin required",
			error_code: "UNAUTHORIZED",
            timestamp: new Date(),
		}
	}

	const lockResource = `review:mutate:${reviewId}`

	return await cacheManager.withLock(
		lockResource,
		async () => {
			try {
				await db
					.update(review)
					.set({ approved: false })
					.where(eq(review.id, reviewId))

				await cacheManager.invalidateByTag("reviews_average")
				await cacheManager.invalidateByTag("reviews_list")

				revalidatePath("/dashboard/reviews")

				return {
					success: true,
					message: "Review rejected",
					timestamp: new Date(),
				}
			} catch (err) {
				CLogger.error("Review rejection failed", { error: err })
				return {
					success: false,
					message: "Rejection failed",
					error_code: "REJECTION_ERROR",
                    timestamp: new Date(),
				}
			}
		},
		10000,
		5,
	)
}

// ────────────────────────────────────────────────
// 5. Global average rating of approved reviews (cached)
// ────────────────────────────────────────────────
export async function getAverageRating(): Promise<
	APIResponse<{ average: number; count: number }>
> {
	const cacheKey = "reviews:average_rating"

	try {
		const cached = await cacheManager.get<{
			average: number
			count: number
		}>(cacheKey)
		if (cached) {
			return {
				success: true,
				message: "Average from cache",
				data: cached,
				timestamp: new Date(),
			}
		}

		const result = await db
			.select({
				count: count(review.id).as("count"),
				average: avg(review.rating).as("average"),
			})
			.from(review)
			.where(eq(review.approved, true))

		const data = {
			average: Number(result[0]?.average ?? 0),
			count: Number(result[0]?.count ?? 0),
		}

		await cacheManager.set(cacheKey, data, 600, ["reviews_average"])

		return {
			success: true,
			message: "Average calculated",
			data,
			timestamp: new Date(),
		}
	} catch (err) {
		CLogger.error("Average rating calculation failed", { error: err })
		return {
			success: false,
			message: "Calculation failed",
			error_code: "CALC_ERROR",
            timestamp: new Date(),
		}
	}
}
