"use server"

import db from "@/db"
import { bulkRequest, FullBulkRequest, type BulkRequestStatusEnum } from "@/db/models/request"
import { productSizeVariant, product } from "@/db/models/product"
import { user } from "@/db/models/user"
import { CLogger } from "@/lib/logger"
import { cacheManager } from "@/lib/redis"
import { APIResponse, PaginatedAPIResponse } from "@/types/api"
import { desc, eq, and, lt, or, ilike } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { nanoid } from "nanoid"

interface BulkRequestItem {
    productSizeId: string
    quantity: string
}

/**
 * Submit multiple bulk requests (authenticated user + per-user lock)
 */
export async function createBulkRequest(values: {
    items: BulkRequestItem[]
}): Promise<APIResponse<any>> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return {
            success: false,
            message: "Authentication required",
            error_code: "UNAUTHORIZED",
            timestamp: new Date(),
        }
    }

    if (!values.items?.length) {
        return {
            success: false,
            message: "No items provided",
            error_code: "VALIDATION_ERROR",
            timestamp: new Date(),
        }
    }

    const lockResource = `bulk_request:create:user:${session.user.id}`

    return await cacheManager.withLock(lockResource, async () => {
        try {
            const result = await db.transaction(async (tx) => {
                const requestId = `REQ-${nanoid(8).toUpperCase()}`

                const insertValues = values.items.map((item) => ({
                    requestId,
                    userId: session.user.id,
                    productSizeId: item.productSizeId,
                    quantity: item.quantity,
                    status: "pending" as const,
                }))

                const newRequests = await tx
                    .insert(bulkRequest)
                    .values(insertValues)
                    .returning()

                return { requestId, newRequests }
            })

            CLogger.info(`Bulk request created: ${result.requestId} | ${values.items.length} items | User: ${session.user.id}`)

            await purgeBulkRequestCaches(session.user.id)

            return {
                success: true,
                message: "Bulk requests submitted successfully",
                data: result.newRequests,
                timestamp: new Date(),
            }
        } catch (err) {
            CLogger.error("Bulk request creation failed", { error: err })
            return {
                success: false,
                message: "Failed to submit bulk request",
                error_code: "CREATE_ERROR",
                timestamp: new Date(),
            }
        }
    }, 12000, 5)
}

/**
 * Admin/Staff: Get all bulk requests with pagination + search
 */
export async function getBulkRequests({
    limit = 10,
    cursor,
    search,
    status,
}: {
    limit?: number
    cursor?: string
    search?: string
    status?: BulkRequestStatusEnum
}): Promise<PaginatedAPIResponse<FullBulkRequest>> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
        return {
            success: false,
            message: "Admin/Staff access required",
            error_code: "UNAUTHORIZED",
            timestamp: new Date(),
        }
    }

    const limitVal = limit
    const searchTerm = search?.trim().toLowerCase() ?? ""
    const cacheKey = `admin:bulk_requests:status:${status || "all"}:c:${cursor || "head"}:limit:${limitVal}:q:${searchTerm || "none"}`

    try {
        const cached = await cacheManager.get<PaginatedAPIResponse<FullBulkRequest>>(cacheKey)
        if (cached) {
            return cached
        }

        const filters = []

        if (cursor) {
            const cursorDate = new Date(cursor)
            if (!isNaN(cursorDate.getTime())) {
                filters.push(lt(bulkRequest.createdAt, cursorDate))
            }
        }

        if (status) {
            filters.push(eq(bulkRequest.status, status))
        }

        if (searchTerm) {
            filters.push(
                or(
                    ilike(product.name, `%${searchTerm}%`),
                    ilike(user.name, `%${searchTerm}%`),
                    ilike(user.email, `%${searchTerm}%`),
                    ilike(bulkRequest.requestId, `%${searchTerm}%`)
                )
            )
        }

        const results = await db.query.bulkRequest.findMany({
            where: filters.length > 0 ? and(...filters) : undefined,
            with: {
                user: true,
                productSize: {
                    with: {
                        product: true
                    },
                },
            },
            orderBy: [desc(bulkRequest.createdAt)],
            limit: limitVal + 1,
        })

        const hasMore = results.length > limitVal
        const records = hasMore ? results.slice(0, limitVal) : results

        let nextCursor: string | undefined = undefined
        if (hasMore && records.length > 0) {
            nextCursor = records[records.length - 1].createdAt.toISOString()
        }

        const paginatedResponse: PaginatedAPIResponse<FullBulkRequest> = {
            success: true,
            message: "Bulk requests fetched",
            data: {
                records,
                pagination: {
                    nextCursor,
                    prevCursor: cursor,
                    hasMore,
                },
            },
            timestamp: new Date(),
        }

        const ttl = searchTerm ? 300 : 1800
        await cacheManager.set(cacheKey, paginatedResponse, ttl, [
            "bulk_requests_list",
            "admin_dashboard",
            "bulk_requests",
        ])

        return paginatedResponse
    } catch (err) {
        CLogger.error("Bulk requests fetch failed", { error: err })
        return {
            success: false,
            message: "Fetch failed",
            error_code: "FETCH_ERROR",
            timestamp: new Date(),
        }
    }
}

/**
 * Admin/Staff: Update status of a bulk request (locked per request)
 */
export async function updateBulkRequestStatus(
    id: string,
    status: BulkRequestStatusEnum,
    errorMessage?: string
): Promise<APIResponse<any>> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
        return {
            success: false,
            message: "Admin/Staff required",
            error_code: "UNAUTHORIZED",
            timestamp: new Date(),
        }
    }

    const lockResource = `bulk_request:update:${id}`

    return await cacheManager.withLock(lockResource, async () => {
        try {
            const [updated] = await db
                .update(bulkRequest)
                .set({
                    status,
                    errorMessage,
                    updatedAt: new Date(),
                })
                .where(eq(bulkRequest.id, id))
                .returning()

            if (!updated) {
                return {
                    success: false,
                    message: "Request not found",
                    error_code: "NOT_FOUND",
                    timestamp: new Date(),
                }
            }

            await purgeBulkRequestCaches(updated.userId)

            return {
                success: true,
                message: `Request updated to ${status}`,
                data: updated,
                timestamp: new Date(),
            }
        } catch (err) {
            CLogger.error("Bulk request status update failed", { error: err })
            return {
                success: false,
                message: "Update failed",
                error_code: "UPDATE_ERROR",
                timestamp: new Date(),
            }
        }
    }, 10000, 5)
}

/**
 * Centralized cache invalidation
 */
async function purgeBulkRequestCaches(userId?: string) {
    const tasks = [
        cacheManager.invalidateByTag("bulk_requests_list"),
        cacheManager.invalidateByTag("bulk_requests"),
        cacheManager.invalidatePattern("admin:bulk_requests:*"),
    ]

    if (userId) {
        tasks.push(cacheManager.invalidateByTag(`user_requests:${userId}`))
    }

    await Promise.all(tasks)
    revalidatePath("/dashboard/requests")
}