import { index, numeric, pgTable, text, pgEnum, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { abstract } from "../helpers/abstract";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod";

import { user } from "./user";
import { product, productSizeVariant } from "./product";
import { User } from "@/db/models/user";

export const order = pgTable(
    "order",
    {
        ...abstract,
        orderId: text("order_id").notNull().unique(),
        guestEmail: text("guest_email"),
        phone: text("phone"),
        userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
        totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
        status: text("status").notNull().default("pending"),
        isPaid: boolean("is_paid").notNull().default(false),
        paidAt: timestamp("paid_at"),
    },
    (table) => [
        index("order_created_at_idx").on(table.createdAt),
        index("order_user_id_idx").on(table.userId),
        index("order_order_id_idx").on(table.orderId),
    ]
);

export const orderRelations = relations(order, ({ one, many }) => ({
    user: one(user, {
        fields: [order.userId],
        references: [user.id],
    }),
    items: many(orderItem),
    delivery: one(orderDelivery, {
        fields: [order.orderId],
        references: [orderDelivery.orderId],
    }),
}));

export const orderInsertSchema = createInsertSchema(order, {
    orderId: z.string().min(1),
    userId: z.string().optional(),
    totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    status: z.string().optional(),
    isPaid: z.boolean().optional(),
    paidAt: z.date().optional(),
});

export type OrderInsertValues = z.infer<typeof orderInsertSchema>;

export const orderUpdateSchema = createUpdateSchema(order, {
    orderId: z.string().min(1).optional(),
    userId: z.string().optional(),
    totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    status: z.string().optional(),
    isPaid: z.boolean().optional(),
    paidAt: z.date().optional(),
});

export type OrderUpdateValues = z.infer<typeof orderUpdateSchema>;

export const orderDeliveryStatusEnum = pgEnum("order_delivery_status_enum", ["pending", "shipped", "delivered", "cancelled"]);

export type OrderDeliveryStatusEnum = "pending" | "shipped" | "delivered" | "cancelled";

export const orderDelivery = pgTable(
    "order_delivery",
    {
        orderId: text("order_id")
            .notNull()
            .references(() => order.orderId, { onDelete: "cascade" }),
        status: orderDeliveryStatusEnum("status").notNull().default("pending"),
        trackingNumber: text("tracking_number"),
        shippingAddress: text("shipping_address"),
        shippingCity: text("shipping_city"),
        shippingState: text("shipping_state"),
        shippingPostalCode: text("shipping_postal_code"),
        shippingCountry: text("shipping_country"),
        shippedAt: timestamp("shipped_at"),
        deliveredAt: timestamp("delivered_at"),
    },
    (table) => [
        index("order_delivery_order_id_idx").on(table.orderId),
    ]
);

export const orderDeliveryRelations = relations(orderDelivery, ({ one }) => ({
    order: one(order, {
        fields: [orderDelivery.orderId],
        references: [order.orderId],
    }),
}));

export const orderDeliveryInsertSchema = createInsertSchema(orderDelivery, {
    orderId: z.string().min(1),
    status: z.enum(["pending", "shipped", "delivered", "cancelled"]).optional(),
    trackingNumber: z.string().optional(),
    shippedAt: z.date().optional(),
    deliveredAt: z.date().optional(),
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingState: z.string().optional(),
    shippingPostalCode: z.string().optional(),
    shippingCountry: z.string().optional(),
});

export type OrderDeliveryInsertValues = z.infer<typeof orderDeliveryInsertSchema>;

export const orderDeliveryUpdateSchema = createUpdateSchema(orderDelivery, {
    orderId: z.string().min(1).optional(),
    status: z.enum(["pending", "shipped", "delivered", "cancelled"]).optional(),
    trackingNumber: z.string().optional(),
    shippedAt: z.date().optional(),
    deliveredAt: z.date().optional(),
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingState: z.string().optional(),
    shippingPostalCode: z.string().optional(),
    shippingCountry: z.string().optional(),
});

export type OrderDeliveryUpdateValues = z.infer<typeof orderDeliveryUpdateSchema>;

export const orderItem = pgTable(
    "order_item",
    {
        orderId: text("order_id")
            .notNull()
            .references(() => order.orderId, { onDelete: "cascade" }),
        productId: text("product_id").references(() => product.id, { onDelete: "cascade" }).notNull(),
        sizeVariantId: text("size_variant_id").references(() => productSizeVariant.id, { onDelete: "cascade" }).notNull(),
        quantity: numeric("quantity", { precision: 10, scale: 0 }).notNull().default("1"),
        priceAtPurchase: numeric("price_at_purchase", { precision: 10, scale: 2 }).notNull().default("0.00"),
    },
    (table) => [
        index("order_item_order_id_idx").on(table.orderId),
    ]
);

export const orderItemRelations = relations(orderItem, ({ one }) => ({
    order: one(order, {
        fields: [orderItem.orderId],
        references: [order.orderId],
    }),
    product: one(product, {
        fields: [orderItem.productId],
        references: [product.id],
    }),
    sizeVariant: one(productSizeVariant, {
        fields: [orderItem.sizeVariantId],
        references: [productSizeVariant.id],
    }),
}));

export type OrderDelivery = typeof orderDelivery.$inferSelect;
export type Order = typeof order.$inferSelect;
export type OrderItem = typeof orderItem.$inferSelect;
export type FullOrder = Order & {
    user: User | null;
    items: OrderItem[];
    delivery: OrderDelivery;
};