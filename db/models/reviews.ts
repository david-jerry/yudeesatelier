import { index, pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { abstract } from "../helpers/abstract";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod";
import { product } from "./product";
import { User, user } from "./user";

export const review = pgTable(
    "review",
    {
        userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
        rating: integer("rating").notNull().$defaultFn(() => 5),
        comment: text("comment"),
        approved: boolean("approved").notNull().default(false),
        ...abstract,
    },
    (table) => [
        index("review_created_at_idx").on(table.createdAt),
        index("review_user_id_idx").on(table.userId),
    ]
);

export const reviewRelations = relations(review, ({ one }) => ({
    user: one(user, {
        fields: [review.userId],
        references: [user.id],
    }),
}));

export const reviewInsertSchema = createInsertSchema(review, {
    userId: z.string().min(1),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
    approved: z.boolean().optional(),
});

export type ReviewInsertValues = z.infer<typeof reviewInsertSchema>;

export const reviewUpdateSchema = createUpdateSchema(review, {
    userId: z.string().min(1).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().optional(),
    approved: z.boolean().optional(),
});

export type ReviewUpdateValues = z.infer<typeof reviewUpdateSchema >;

export type Review = typeof review.$inferSelect;

export type FullReview = Review & {
    user: User | null;
};