import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { abstract } from "../helpers/abstract";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod";
import { user } from "./user";
import { FullProduct, product } from "./product";

export const wishlist = pgTable(
    "wishlist",
    {
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        productId: text("product_id").notNull().references(() => product.id, { onDelete: "cascade" }),
        ...abstract,
    },
    (table) => [
        index("wishlist_created_at_idx").on(table.createdAt),
        index("wishlist_user_id_idx").on(table.userId),
        index("wishlist_product_id_idx").on(table.productId),
    ]
);

export const wishlistRelations = relations(wishlist, ({ one }) => ({
    user: one(user, {
        fields: [wishlist.userId],
        references: [user.id],
    }),
    product: one(product, {
        fields: [wishlist.productId],
        references: [product.id],
    }),
}));

export const wishlistInsertSchema = createInsertSchema(wishlist, {
    userId: z.string().min(1),
    productId: z.string().min(1),
});

export type WishlistInsertValues = z.infer<typeof wishlistInsertSchema>;

export const wishlistUpdateSchema = createUpdateSchema(wishlist, {
    userId: z.string().min(1).optional(),
    productId: z.string().min(1).optional(),
});

export type WishlistUpdateValues = z.infer<typeof wishlistUpdateSchema>;

export type Wishlist = typeof wishlist.$inferSelect
export type FullWishlistItem = Wishlist & {
    product: FullProduct
}