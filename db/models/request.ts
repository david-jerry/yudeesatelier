import { index, numeric, pgTable, text, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { abstract } from "../helpers/abstract";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod";
import { product, productSizeVariant } from "./product";
import { user } from "./user";

export const bulkRequestStatusEnum = pgEnum("bulk_request_status_enum", ["pending", "processing", "completed", "failed", "cancelled"]);

export type BulkRequestStatusEnum = "pending" | "processing" | "completed" | "failed" | "cancelled";

export const bulkRequest = pgTable(
    "bulk_request",
    {
        ...abstract,
        requestId: text("request_id").notNull().unique(),
        userId: text("user_id").notNull(),
        productSizeId: text("product_size_id").references(() => productSizeVariant.id, { onDelete: "cascade" }).notNull(),
        quantity: numeric("quantity", { precision: 10, scale: 0 }).notNull().default("1"),
        status: bulkRequestStatusEnum("status").notNull().default("pending"),
        errorMessage: text("error_message"),
    },
    (table) => [
        index("bulk_request_created_at_idx").on(table.createdAt),
        index("bulk_request_user_id_idx").on(table.userId),
        index("bulk_request_product_size_id_idx").on(table.productSizeId),
    ]
);

export const bulkRequestRelations = relations(bulkRequest, ({ one }) => ({
    productSize: one(productSizeVariant, {
        fields: [bulkRequest.productSizeId],
        references: [productSizeVariant.id],
    }),
    user: one(user, {
        fields: [bulkRequest.userId],
        references: [user.id],
    }),
}));

export const bulkRequestInsertSchema = createInsertSchema(bulkRequest, {
    requestId: z.string().min(1),
    userId: z.string().min(1),
    productSizeId: z.string().min(1),
    quantity: z.number().int().positive().optional(),
    status: z.enum(["pending", "processing", "completed", "failed", "cancelled"]).optional(),
    errorMessage: z.string().optional(),
});

export type BulkRequestInsertValues = z.infer<typeof bulkRequestInsertSchema>;

export const bulkRequestUpdateSchema = createUpdateSchema(bulkRequest, {
    requestId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    productSizeId: z.string().min(1).optional(),
    quantity: z.number().int().positive().optional(),
    status: z.enum(["pending", "processing", "completed", "failed", "cancelled"]).optional(),
    errorMessage: z.string().optional(),
});

export type BulkRequestUpdateValues = z.infer<typeof bulkRequestUpdateSchema>;

export type BulkRequest = typeof bulkRequest.$inferSelect;

export type FullBulkRequest = typeof bulkRequest.$inferSelect & {
    user: typeof user.$inferSelect;
    productSize: typeof productSizeVariant.$inferSelect & {
        product: typeof product.$inferSelect;
    };
};