"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import db from "@/db"
import { wishlist } from "@/db/models"
import { and, eq, desc } from "drizzle-orm"
import { APIResponse } from "@/types/api"
import { CLogger } from "@/lib/logger"
import { cacheManager } from "@/lib/redis"
import { FullWishlistItem } from "@/db/models/wishlist"

const WISHLIST_TTL = 3600;

/**
 * List all items in the user's wishlist (Cached)
 */
export async function getWishlist(): Promise<APIResponse<FullWishlistItem[]>> {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session?.user) {
        return {
            success: false,
            message: "Unauthorized access.",
            timestamp: new Date()
        }
    }

    const cacheKey = `wishlist_list:${session.user.id}`;
    const wishlistTag = `wishlist:${session.user.id}`;

    try {
        const data = await cacheManager.wrap(
            cacheKey,
            async () => {
                CLogger.info(`[DB_HIT] Fetching wishlist from DB for user: ${session.user.id}`);
                return await db.query.wishlist.findMany({
                    where: eq(wishlist.userId, session.user.id),
                    with: {
                        product: {
                            with: {
                                tag: true,
                                images: true,
                                sizeVariants: {
                                    with: {
                                        measurements: true
                                    }
                                },
                            }
                        }
                    },
                    orderBy: [desc(wishlist.createdAt)],
                });
            },
            WISHLIST_TTL,
            [wishlistTag]
        );

        return {
            success: true,
            message: "Wishlist retrieved successfully.",
            data: data,
            timestamp: new Date()
        }
    } catch (error) {
        CLogger.error("Wishlist fetch error", { error })
        return {
            success: false,
            message: "Could not retrieve your wishlist.",
            timestamp: new Date()
        }
    }
}

/**
 * Add a product to the user's wishlist with Distributed Locking
 */
export async function addToWishlist(productId: string): Promise<APIResponse<undefined>> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return { success: false, message: "Unauthorized", timestamp: new Date() }
    }

    const lockResource = `wishlist_add:${session.user.id}:${productId}`;

    try {
        return await cacheManager.withLock(lockResource, async () => {
            // 1. Check existence within the lock
            const existing = await db.query.wishlist.findFirst({
                where: and(
                    eq(wishlist.userId, session.user.id),
                    eq(wishlist.productId, productId)
                )
            });

            if (existing) {
                return {
                    success: true,
                    message: "Already in wishlist.",
                    timestamp: new Date()
                };
            }

            // 2. Perform DB insert
            await db.insert(wishlist).values({
                userId: session.user.id,
                productId: productId,
            });

            // 3. Invalidate cache
            await cacheManager.invalidateByTag(`wishlist:${session.user.id}`);

            CLogger.info(`Wishlist updated. Cache invalidated for user ${session.user.id}`);
            revalidatePath("/dashboard/wishlist");

            return {
                success: true,
                message: "Added successfully.",
                timestamp: new Date()
            };
        });
    } catch (error) {
        CLogger.error("Error in addToWishlist with lock", { error });
        return {
            success: false,
            message: "Action failed. Please try again.",
            timestamp: new Date()
        };
    }
}

/**
 * Remove a product from the wishlist with Distributed Locking
 */
export async function removeFromWishlist(productId: string): Promise<APIResponse<undefined>> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return { success: false, message: "Unauthorized", timestamp: new Date() }
    }

    const lockResource = `wishlist_remove:${session.user.id}:${productId}`;

    try {
        return await cacheManager.withLock(lockResource, async () => {
            await db.delete(wishlist).where(
                and(
                    eq(wishlist.userId, session.user.id),
                    eq(wishlist.productId, productId)
                )
            );

            await cacheManager.invalidateByTag(`wishlist:${session.user.id}`);

            CLogger.info(`Wishlist item removed. Cache invalidated for user ${session.user.id}`);
            revalidatePath("/dashboard/wishlist");

            return {
                success: true,
                message: "Item removed.",
                timestamp: new Date()
            };
        });
    } catch (error) {
        CLogger.error("Error in removeFromWishlist with lock", { error });
        return {
            success: false,
            message: "Failed to remove item.",
            timestamp: new Date()
        };
    }
}