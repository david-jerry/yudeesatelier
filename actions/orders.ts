"use server"

import db from "@/db"
import {
  order,
  orderItem,
  orderDelivery,
  Order,
  FullOrder, // assume you have this type with relations
  OrderDeliveryStatusEnum,
} from "@/db/models/order"
import { product, productSizeVariant } from "@/db/models/product"
import { user } from "@/db/models/user"
import { CLogger } from "@/lib/logger"
import { cacheManager } from "@/lib/redis"
import { APIResponse, PaginatedAPIResponse } from "@/types/api"
import { desc, eq, and, lt, or, ilike, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { nanoid } from "nanoid"
import { initializePayment } from "./paystack"
import { config } from "@/config"

type CreateOrderInput = {
  cartItems: Array<{
    productId: string
    variantId: string
    quantity: number
    price: number // price at time of purchase
  }>
  shipping: {
    fullName: string
    address: string
    city: string
    state: string
    postalCode?: string
    country: string
    phone: string
  }
  guestEmail?: string
}

// ────────────────────────────────────────────────
// 1. Create Order + Order Items + Delivery (authenticated or guest)
export async function createOrder(
  input: CreateOrderInput
): Promise<APIResponse<{
  authorizationUrl: string;
  orderId: string;
  reference: string;
}>> {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id ?? null

  if (!userId && !input.guestEmail) {
    return {
      success: false,
      message: "Authentication or guest email required",
      error_code: "VALIDATION_ERROR",
      timestamp: new Date(),
    }
  }

  if (input.cartItems.length === 0) {
    return {
      success: false,
      message: "Cart is empty",
      error_code: "VALIDATION_ERROR",
      timestamp: new Date(),
    }
  }

  const totalAmount = input.cartItems
    .reduce((sum, i) => sum + i.price * i.quantity, 0)
    .toFixed(2)

  // Optional: lock per user (or per guest email) to prevent duplicate orders
  const lockKey = userId ? `order:create:user:${userId}` : `order:create:guest:${input.guestEmail || "anon"}`

  return await cacheManager.withLock(lockKey, async () => {
    try {
      const result = await db.transaction(async (tx) => {
        const orderId = `ORD-${nanoid(10).toUpperCase()}`

        // 1. Create main order
        const [newOrder] = await tx
          .insert(order)
          .values({
            orderId,
            userId,
            phone: input.shipping.phone,
            guestEmail: input.guestEmail,
            totalAmount,
            status: "pending",
            isPaid: false,
          })
          .returning()

        // 2. Create order items
        await tx.insert(orderItem).values(
          input.cartItems.map((item) => ({
            orderId: newOrder.orderId,
            productId: item.productId, // adjust if needed
            sizeVariantId: item.variantId,
            quantity: item.quantity.toString(),
            priceAtPurchase: item.price.toFixed(2),
          }))
        )

        // 3. Create delivery record
        await tx.insert(orderDelivery).values({
          orderId: newOrder.orderId,
          status: "pending",
          shippingAddress: input.shipping.address,
          shippingCity: input.shipping.city,
          shippingState: input.shipping.state,
          shippingPostalCode: input.shipping.postalCode,
          shippingCountry: input.shipping.country,
        })

        return { orderId: newOrder.orderId }
      })

      // Invalidate caches
      await purgeOrderCaches(userId)

      const callbackUrl = `${config.DOMAIN}/checkout/confirm?orderId=${result.orderId}`
      console.log("CALLBACKURL: ", callbackUrl)
      const payRes = await initializePayment({
        email: input.guestEmail || session?.user?.email || "",
        amount: Number(totalAmount),
        metadata: {
          orderId: result.orderId,
          userId: userId ?? "guest",
          cartSummary: input.cartItems.length + " items",
        },
        currency: "NGN",
        callbackUrl, // ← very important
      })

      if (!payRes.status) {
        // rollback? (optional - you can delete the pending order if you want strict atomicity)
        await db.delete(order).where(eq(order.orderId, result.orderId))
        return {
          success: false,
          message: payRes.error || "Payment init failed",
          error_code: "PAYMENT_INIT_ERROR",
          timestamp: new Date(),
        }
      }

      const data = {
        authorizationUrl: payRes.data.authorization_url,
        orderId: result.orderId,
        reference: payRes.data.reference,
      }

      return {
        success: true,
        message: "Order created successfully",
        data,
        timestamp: new Date(),
      }
    } catch (err) {
      CLogger.error("Order creation failed", { error: err })
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to create order",
        error_code: "CREATE_ERROR",
        timestamp: new Date(),
      }
    }
  }, 15000, 5) // 15s lock, 5 retries
}

// ────────────────────────────────────────────────
// 2. Admin/Staff: List all orders (paginated + search)
export async function getOrders({
  limit = 10,
  cursor,
  search,
  status,
}: {
  limit?: number
  cursor?: string
  search?: string
  status?: string // e.g. "pending", "processing", etc.
}): Promise<PaginatedAPIResponse<FullOrder>> {
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
  const cacheKey = `admin:orders:status:${status || "all"}:c:${cursor || "head"}:l:${limitVal}:q:${searchTerm || "none"}`

  try {
    const cached = await cacheManager.get<PaginatedAPIResponse<FullOrder>>(cacheKey)
    if (cached) return cached

    const filters = []

    if (cursor) {
      const cursorDate = new Date(cursor)
      if (!isNaN(cursorDate.getTime())) {
        filters.push(lt(order.createdAt, cursorDate))
      }
    }

    if (status) {
      filters.push(eq(order.status, status))
    }

    if (searchTerm) {
      filters.push(
        or(
          ilike(order.orderId, `%${searchTerm}%`),
          ilike(user.name, `%${searchTerm}%`),
          ilike(user.email, `%${searchTerm}%`),
          ilike(order.guestEmail, `%${searchTerm}%`)
        )
      )
    }

    const results = await db.query.order.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      with: {
        user: true,
        items: true, // To get item counts in admin list
        delivery: true,
      },
      orderBy: [desc(order.createdAt)],
      limit: limitVal + 1,
    })

    const hasMore = results.length > limitVal
    const records = hasMore ? results.slice(0, limitVal) : results

    let nextCursor: string | undefined = undefined
    if (hasMore && records.length > 0) {
      nextCursor = records[records.length - 1].createdAt.toISOString()
    }

    const paginatedResponse: PaginatedAPIResponse<FullOrder> = {
      success: true,
      message: "Orders fetched",
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

    const ttl = searchTerm ? 300 : 1800 // 5 min search / 30 min full list
    await cacheManager.set(cacheKey, paginatedResponse, ttl, [
      "orders_list",
      "admin_orders",
      "orders",
    ])

    return paginatedResponse
  } catch (err) {
    CLogger.error("Orders fetch failed", { error: err })
    return {
      success: false,
      message: "Fetch failed",
      error_code: "FETCH_ERROR",
      timestamp: new Date(),
    }
  }
}

// ────────────────────────────────────────────────
// 3. Admin/Staff: Update order status (locked per order)
export async function updateOrderStatus(
  orderId: string,
  status: string,
  note?: string
): Promise<APIResponse<{ orderId: string }>> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
    return {
      success: false,
      message: "Admin/Staff required",
      error_code: "UNAUTHORIZED",
      timestamp: new Date(),
    }
  }

  const lockResource = `order:update:${orderId}`

  return await cacheManager.withLock(lockResource, async () => {
    try {
      const [updated] = await db
        .update(order)
        .set({
          status,
          // You can add note field if you have it in schema
          updatedAt: new Date(),
        })
        .where(eq(order.orderId, orderId))
        .returning()

      if (!updated) {
        return {
          success: false,
          message: "Order not found",
          error_code: "NOT_FOUND",
          timestamp: new Date(),
        }
      }

      await purgeOrderCaches(updated.userId)

      return {
        success: true,
        message: `Order updated to ${status}`,
        data: { orderId },
        timestamp: new Date(),
      }
    } catch (err) {
      CLogger.error("Order status update failed", { error: err })
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
 * Fetches the current authenticated user's orders with item counts.
 */
export async function getUserOrders({
  limit = 10,
  cursor,
}: {
  limit?: number
  cursor?: string
}): Promise<PaginatedAPIResponse<FullOrder>> {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id

  // 1. Initial Identity Log
  CLogger.info(`Fetch initiated for User: ${userId || "Anonymous"} | Cursor: ${cursor || "HEAD"}`);

  if (!userId) {
    CLogger.warn("Fetch aborted: No active session found");
    return {
      success: false,
      message: "Authentication required",
      error_code: "UNAUTHORIZED",
      timestamp: new Date(),
    }
  }

  const cacheKey = `user_orders:${userId}:c:${cursor || "head"}`

  try {
    // 2. Cache Trace
    const cached = await cacheManager.get<PaginatedAPIResponse<FullOrder>>(cacheKey)
    if (cached) {
      CLogger.info(`Cache Hit for key: ${cacheKey}`);
      return cached;
    }
    CLogger.info(`Cache Miss for key: ${cacheKey}. Querying database...`);

    const filters = [eq(order.userId, userId)]

    // 3. Cursor Validation Log
    if (cursor) {
      const cursorDate = new Date(cursor)
      const isValidDate = !isNaN(cursorDate.getTime());

      CLogger.info(`Processing Cursor: "${cursor}" | Validated Date: ${cursorDate.toISOString()} | IsValid: ${isValidDate}`);

      if (isValidDate) {
        filters.push(lt(order.createdAt, cursorDate))
      } else {
        CLogger.error(`Invalid cursor format received: ${cursor}`);
      }
    }

    // 4. Query Execution Trace
    CLogger.info("Executing Drizzle findMany query...");
    const records = await db.query.order.findMany({
      where: and(...filters),
      with: {
        user: true,
        items: true,
        delivery: true,
      },
      orderBy: [desc(order.createdAt)],
      limit: limit + 1,
    })

    CLogger.info(`Query completed. Records found: ${records.length}`);

    const hasMore = records.length > limit
    const results = hasMore ? records.slice(0, limit) : records
    const prevCursor = cursor

    // 5. Next Cursor Generation Log
    const lastItem = results[results.length - 1];
    const nextCursor = hasMore && lastItem ? lastItem.createdAt.toISOString() : undefined;

    CLogger.info(`Pagination State - hasMore: ${hasMore} | New nextCursor: ${nextCursor}`);

    const data = {
      records: results,
      pagination: {
        nextCursor,
        hasMore,
        prevCursor,
      },
    }

    const resp = {
      success: true,
      message: "Orders retrieved",
      data,
      timestamp: new Date()
    }

    // 6. Cache Storage Log
    await cacheManager.set(cacheKey, resp, 1800, [`user_orders:${userId}`])
    CLogger.info(`Successfully cached results for key: ${cacheKey}`);

    return resp
  } catch (err) {
    // 7. Enhanced Error Context
    CLogger.error("User orders fetch failed", {
      error: err,
      context: { userId, cursor, cacheKey }
    })
    return {
      success: false,
      message: "Failed to load order trail",
      error_code: "FETCH_ERROR",
      timestamp: new Date()
    }
  }
}

// actions/order.ts
export async function updateOrderAfterPayment(input: {
  orderId: string
  reference: string
  paidAmount: number
  paidAt: Date
}): Promise<APIResponse<null>> {
  const lockKey = `lock:payment:finalize:${input.orderId}`

  return await cacheManager.withLock(lockKey, async () => {
    try {
      return await db.transaction(async (tx) => {
        // 1. SELECT FOR UPDATE: Lock the row in Postgres
        const existingOrder = await tx.query.order.findFirst({
          where: eq(order.orderId, input.orderId),
        })

        if (!existingOrder) throw new Error("Order not found")

        // 2. IDEMPOTENCY CHECK: Prevent double processing of same Paystack webhook
        if (existingOrder.isPaid) {
          return { success: true, message: "Order already processed", data: null, timestamp: new Date() }
        }

        const [updatedOrder] = await tx
          .update(order)
          .set({
            isPaid: true,
            paidAt: input.paidAt,
            status: "processing",
            updatedAt: new Date(),
          })
          .where(eq(order.orderId, input.orderId))
          .returning()

        await purgeOrderCaches(updatedOrder.userId)
        CLogger.info(`Order ${input.orderId} paid successfully via Paystack`)

        return { success: true, message: "Order finalized", data: null, timestamp: new Date() }
      })
    } catch (err) {
      CLogger.error("Failed to finalize order", { error: err, orderId: input.orderId })
      return { success: false, message: "Order finalization failed", timestamp: new Date(), error_code: "FINALIZATION_ERROR" }
    }
  }, 10000, 3)
}

// ────────────────────────────────────────────────
// 4. Centralized cache invalidation
async function purgeOrderCaches(userId?: string | null) {
  const tasks = [
    cacheManager.invalidateByTag("orders_list"),
    cacheManager.invalidateByTag("orders"),
    cacheManager.invalidatePattern("admin:orders:*"),
  ]

  if (userId) {
    tasks.push(cacheManager.invalidateByTag(`user_orders:${userId}`))
  }

  await Promise.all(tasks)
  revalidatePath("/dashboard/orders")
  revalidatePath("/account/orders") // if user has order history page
}