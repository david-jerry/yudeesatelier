import { index, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { abstract } from "../helpers/abstract";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod";
import { user } from "./user";

export const wallet = pgTable(
    "wallet",
    {
        ...abstract,
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }).unique(),
        holding: numeric("holding", { precision: 10, scale: 2 }).notNull().default("0.00"),
        withdrawn: numeric("withdrawn", { precision: 10, scale: 2 }).notNull().default("0.00"),
    },
    (table) => [
        index("wallet_created_at_idx").on(table.createdAt),
        index("wallet_user_id_idx").on(table.userId),
    ]
);

export const walletRelations = relations(wallet, ({ one }) => ({
    user: one(user, {
        fields: [wallet.userId],
        references: [user.id],
    }),
}));

export const walletInsertSchema = createInsertSchema(wallet, {
    userId: z.string().min(1),
    holding: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    withdrawn: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export type WalletInsertValues = z.infer<typeof walletInsertSchema>;

export const walletUpdateSchema = createUpdateSchema(wallet, {
    userId: z.string().min(1).optional(),
    holding: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    withdrawn: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export type WalletUpdateValues = z.infer<typeof walletUpdateSchema>;

export type Wallet = typeof wallet.$inferSelect;