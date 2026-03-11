"use server"

import db from "@/db";
import { user } from "@/db/models";
import { and, desc, eq, ilike, lt, or } from "drizzle-orm";
import { APIResponse, PaginatedAPIResponse } from "@/types/api"; // Path to your APIResponse model
import { CLogger, pprint } from "@/lib/logger";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cacheManager } from "@/lib/redis";
import { FullUserResponse, User } from "@/db/models/user";

interface CheckEmailRequest {
    email: string;
}

interface SearchParams {
    query: string;
    limit?: number;
}

// Defining a specific type for the search result to keep the response lean
export type UserSearchResult = {
    id: string;
    name: string;
    email: string;
};

/**
 * Searches users by Name, Email, or ID.
 * Optimized for administrative dashboard usage.
 */
export async function searchUsers({
    query,
    limit = 10
}: SearchParams): Promise<APIResponse<UserSearchResult[]>> {

    if (!query.trim()) {
        return {
            success: true,
            message: "Query is empty",
            data: [],
            timestamp: new Date(),
        };
    }

    try {
        CLogger.info("Initiating user search", { query, limit });

        const results = await db.query.user.findMany({
            where: or(
                ilike(user.name, `%${query}%`),
                ilike(user.email, `%${query}%`),
                eq(user.id, query)
            ),
            columns: {
                id: true,
                name: true,
                email: true,
            },
            limit,
        });

        // Use pprint for well-formatted reading in the CLI (per 2026-02-24)
        pprint(results);

        return {
            success: true,
            message: `Found ${results.length} users matching criteria`,
            data: results,
            timestamp: new Date(),
        };

    } catch (err: any) {
        CLogger.error("searchUsers failure", {
            query,
            error: err.message
        });

        return {
            success: false,
            message: "Failed to retrieve user search results",
            data: [],
            timestamp: new Date(),
            error_code: "DB_SEARCH_ERROR"
        };
    }
}

/**
 * Standardized Auth Check for Server Actions and Components.
 */
export async function authCheck(): Promise<APIResponse<boolean>> {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            CLogger.warn("Unauthorized access attempt detected");
            return {
                success: false,
                message: "Unauthorized",
                data: false,
                timestamp: new Date(),
                error_code: "UNAUTHORIZED"
            };
        }

        return {
            success: true,
            message: "Authenticated",
            data: true,
            timestamp: new Date(),
        };
    } catch (error: any) {
        CLogger.error("Critical failure during authCheck", { error: error.message });
        return {
            success: false,
            message: error.message || "There was an error fetching the user record",
            data: false,
            timestamp: new Date(),
            error_code: "AUTH_SYSTEM_FAILURE"
        };
    }
}

/**
 * Checks if a user email already exists in the Yudees Atelier database.
 * Uses the standardized APIResponse wrapper.
 */
export async function checkEmailExists({
    email,
}: CheckEmailRequest): Promise<APIResponse<boolean>> {
    try {
        CLogger.info("Checking email existence", { email });

        const result = await db.query.user.findFirst({
            where: eq(user.email, email.toLowerCase())
        });

        const exists = result !== undefined;

        return {
            success: true,
            message: exists ? "Email is already registered" : "Email is available",
            data: exists, // Updated to use Optional<T> logic implicitly via APIResponse
            timestamp: new Date(),
            error_code: "EMAIL_CHECK_SUCCESS"
        };

    } catch (error: any) {
        CLogger.error("Error checking email existence", {
            email,
            error: error.message
        });

        return {
            success: false,
            message: "An error occurred while verifying the email address.",
            data: false,
            timestamp: new Date(),
            error_code: "INTERNAL_SERVER_ERROR"
        };
    }
}

interface GetUsersParams {
    cursor?: string;
    limit?: number;
    search?: string;
}

/**
 * Fetches a searchable, paginated list of users for the Admin Registry.
 * strictly restricted to Admin/Staff access.
 */
export async function getUsers({
    cursor,
    limit = 10,
    search = "",
}: GetUsersParams): Promise<PaginatedAPIResponse<FullUserResponse>> {

    // 1. Authorization Guard
    const session = await auth.api.getSession({ headers: await headers() });

    // Strict check: Only Admin or Staff can view the registry
    if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
        CLogger.error(`[Auth] Unauthorized attempt to fetch user registry`);
        return {
            success: false,
            message: "Unauthorized: Access to the registry is restricted",
            timestamp: new Date(),
            error_code: "UNAUTHORIZED"
        };
    }

    const sanitizedSearch = search.trim().toLowerCase();
    const cacheKey = `admin:users:list:${cursor ?? "head"}:limit:${limit}:q:${sanitizedSearch || "none"}`;
    const cacheTags = ["user_list", "admin_users", "admin_dashboard"];

    try {
        CLogger.info(`[Admin] Syncing user registry. Search: "${sanitizedSearch || 'none'}"`);

        // 2. Use the .wrap pattern from your CacheManager
        const userData = await cacheManager.wrap(
            cacheKey,
            async () => {
                const filters = [];

                // Cursor Logic using createdAt for stable pagination
                if (cursor) {
                    filters.push(lt(user.createdAt, new Date(cursor)));
                }

                // Search Logic (Name or Email)
                if (sanitizedSearch) {
                    filters.push(
                        or(
                            ilike(user.name, `%${sanitizedSearch}%`),
                            ilike(user.email, `%${sanitizedSearch}%`)
                        )
                    );
                }

                // 3. Database Query with Relations
                const results = await db.query.user.findMany({
                    where: filters.length > 0 ? and(...filters) : undefined,
                    with: {
                        sessions: true,
                        accounts: true,
                        wallet: true,
                        orders: true,
                        passkeys: true,
                        review: true,
                        wishlists: true,
                    },
                    limit: limit + 1,
                    orderBy: [desc(user.createdAt)],
                });

                const hasNextPage = results.length > limit;
                const items = hasNextPage ? results.slice(0, limit) : results;

                // Set nextCursor as ISO string for the next lt() comparison
                const nextCursor = hasNextPage
                    ? items[items.length - 1].createdAt.toISOString()
                    : undefined;

                return {
                    records: items,
                    pagination: {
                        nextCursor,
                        hasMore: hasNextPage,
                        prevCursor: cursor
                    }
                };
            },
            sanitizedSearch ? 300 : 1800, // 5 mins if searching, 30 mins if generic
            cacheTags
        );

        return {
            success: true,
            message: sanitizedSearch
                ? `Registry segment synchronized for "${search}"`
                : "Admin user registry synchronized",
            data: userData,
            timestamp: new Date(),
        };

    } catch (error) {
        CLogger.error("[Admin Users] Registry sync failed", { error });
        return {
            success: false,
            message: "Registry segment locked",
            timestamp: new Date(),
            error_code: "SYNC_ERROR",
            data: undefined
        };
    }
}

/**
 * Updates a user's staff privileges using atomic locking.
 */
export async function updateUserStaffStatus(
    userId: string,
    isStaff: boolean
): Promise<APIResponse<User>> {
    try {
        // 1. Authorization Guard
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
            return {
                success: false,
                message: "Unauthorized: Administrative privileges required",
                timestamp: new Date(),
                error_code: "UNAUTHORIZED"
            };
        }

        // 2. Critical Section with withLock (Next.js CacheManager implementation)
        return await cacheManager.withLock(
            `user:update:${userId}`,
            async () => {
                CLogger.info(`[Admin] Updating staff status`, { userId, isStaff });

                const [updatedUser] = await db
                    .update(user)
                    .set({ isStaff, updatedAt: new Date() })
                    .where(eq(user.id, userId))
                    .returning();

                if (!updatedUser) {
                    throw new Error("USER_NOT_FOUND");
                }

                // 3. Tag-based Invalidation (per project best practices)
                await cacheManager.invalidateByTag("admin_users");
                await cacheManager.invalidateByTag(`user:${userId}`);

                return {
                    success: true,
                    message: `User ${updatedUser.name} staff status updated to ${isStaff}`,
                    data: updatedUser,
                    timestamp: new Date(),
                };
            },
            10000, // 10s TTL for lock
            5      // 5 retries
        );

    } catch (error: any) {
        if (error.message === "USER_NOT_FOUND") {
            return { success: false, message: "User not found", timestamp: new Date(), error_code: "NOT_FOUND" };
        }

        CLogger.error("updateUserStaffStatus failure", { userId, error: error.message });
        return {
            success: false,
            message: error.message.includes("lock")
                ? "Server busy: could not acquire update lock. Try again."
                : "Failed to update staff status",
            timestamp: new Date(),
        };
    }
}

/**
 * Bans or Unbans a user using atomic locking.
 */
export async function updateUserBanStatus(
    userId: string,
    isBanned: boolean
): Promise<APIResponse<User>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
            return { success: false, message: "Unauthorized", timestamp: new Date() };
        }

        return await cacheManager.withLock(
            `user:update:${userId}`,
            async () => {
                CLogger.warn(`[Admin] Changing ban status`, { userId, isBanned });

                const [updatedUser] = await db
                    .update(user)
                    .set({ isBanned, updatedAt: new Date() })
                    .where(eq(user.id, userId))
                    .returning();

                if (!updatedUser) throw new Error("USER_NOT_FOUND");

                await cacheManager.invalidateByTag("admin_users");
                await cacheManager.invalidateByTag(`user:${userId}`);

                return {
                    success: true,
                    message: isBanned ? "User has been banned" : "User ban lifted",
                    data: updatedUser,
                    timestamp: new Date(),
                };
            }
        );

    } catch (error: any) {
        CLogger.error("updateUserBanStatus failure", { userId, error: error.message });
        return {
            success: false,
            message: error.message === "USER_NOT_FOUND" ? "User not found" : "Ban action failed",
            timestamp: new Date()
        };
    }
}



export async function getSafeSession() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        return session;
    } catch (error) {
        // Log the error using your CLogger
        CLogger.error("Session fetch failed, proceeding as guest", error);
        return null; // Return null so the UI treats the user as a guest
    }
}