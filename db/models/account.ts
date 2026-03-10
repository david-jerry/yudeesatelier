import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { abstract } from "../helpers/abstract";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod";
import { user } from "./user";


export const account = pgTable(
    "account",
    {
        accountId: text("account_id").notNull(),
        providerId: text("provider_id").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at"),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
        scope: text("scope"),
        password: text("password"),
        ...abstract,
    },
    (table) => [
        index("account_created_at_idx").on(table.createdAt),
        index("account_user_id_idx").on(table.userId),
        index("account_account_id_idx").on(table.accountId),
    ]
);

export const accountRelations = relations(account, ({ one }) => ({
    user: one(user, {
        fields: [account.userId],
        references: [user.id],
    }),
}));

export const accountInsertSchema = createInsertSchema(account, {
    accountId: z.string().min(1),
    providerId: z.string().min(1),
    userId: z.string().min(1),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    idToken: z.string().optional(),
    accessTokenExpiresAt: z.date().optional(),
    refreshTokenExpiresAt: z.date().optional(),
    scope: z.string().optional(),
    password: z.string().optional(),
});

export type AccountInsertValues = z.infer<typeof accountInsertSchema>;

export const accountUpdateSchema = createUpdateSchema(account, {
    accountId: z.string().min(1).optional(),
    providerId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    idToken: z.string().optional(),
    accessTokenExpiresAt: z.date().optional(),
    refreshTokenExpiresAt: z.date().optional(),
    scope: z.string().optional(),
    password: z.string().optional(),
});

export type AccountUpdateValues = z.infer<typeof accountUpdateSchema>;

export type Account = typeof account.$inferSelect;