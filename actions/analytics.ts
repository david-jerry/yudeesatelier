"use server"

import db from "@/db"
import { Order, order, OrderItem } from "@/db/models/order"
import { Wishlist, wishlist } from "@/db/models/wishlist"
import { auth } from "@/lib/auth"
import { CLogger } from "@/lib/logger"
import { eq, sql, desc } from "drizzle-orm"
import { headers } from "next/headers"
import { cacheManager as cache } from "@/lib/redis" // Assuming your CacheManager path
import { APIResponse } from "@/types/api"
import { FullWishlistItem } from "@/db/models/wishlist"


export async function getDashboardAnalytics(): Promise<APIResponse<DashboardAnalytics>> {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        CLogger.error(`[Auth] Unauthorized analytics fetch`);
        return { success: false, message: "Unauthorized", timestamp: new Date(), error_code: "UNAUTHORIZED" };
    }

    const userId = session.user.id;
    const cacheKey = `dashboard:analytics:${userId}`;

    // Wrapping the logic in CacheManager.wrap for automatic get/set
    return await cache.wrap(
        cacheKey,
        async () => {
            CLogger.info(`[DB_FETCH] Aggregating dashboard data for user: ${userId}`);

            // 1. Total Purchases
            const totalSpentResult = await db
                .select({
                    total: sql<number>`sum(${order.totalAmount})`,
                })
                .from(order)
                .where(eq(order.userId, userId));

            // 2. Recent 4 Orders
            const recentOrders = await db.query.order.findMany({
                where: eq(order.userId, userId),
                limit: 4,
                orderBy: [desc(order.createdAt)],
                with: { items: true },
            });

            // 3. Recent 3 Wishlist Items
            const recentWishlist = await db.query.wishlist.findMany({
                where: eq(wishlist.userId, userId),
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

            return {
                success: true,
                data: {
                    totalSpent: totalSpentResult[0]?.total || 0,
                    recentOrders,
                    recentWishlist,
                    isAdmin: session.user.isAdmin || session.user.isStaff
                },
                message: "Dashboard analytics fetched successfully",
                timestamp: new Date(),
            };
        },
        1800, // 30 mins TTL
        [`user_caches:${userId}`]
    );
}

export type DashboardAnalytics = {
    totalSpent: number,
    recentOrders: {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        userId: string | null;
        orderId: string;
        guestEmail: string | null;
        phone: string | null;
        totalAmount: string;
        status: string;
        isPaid: boolean;
        paidAt: Date | null;
        items: {
            orderId: string;
            quantity: string;
            productId: string;
            sizeVariantId: string;
            priceAtPurchase: string;
        }[];
    }[],
    recentWishlist: FullWishlistItem[],
    isAdmin: boolean
}