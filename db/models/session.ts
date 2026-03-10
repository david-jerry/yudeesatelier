import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { abstract } from "../helpers/abstract";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod";
import { user } from "./user";

export const session = pgTable(
    "session",
    {
        expiresAt: timestamp("expires_at").notNull(),
        token: text("token").notNull().unique(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        impersonatedBy: text("impersonated_by"),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        ...abstract,
    },
    (table) => [
        index("session_created_at_idx").on(table.createdAt),
        index("session_user_id_idx").on(table.userId),
        index("session_token_idx").on(table.token),
    ]
);

export const sessionRelations = relations(session, ({ one }) => ({
    user: one(user, {
        fields: [session.userId],
        references: [user.id],
    }),
}));

export const sessionInsertSchema = createInsertSchema(session, {
    expiresAt: z.date(),
    token: z.string().min(1),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    userId: z.string().min(1),
});

export type SessionInsertValues = z.infer<typeof sessionInsertSchema>;

export const sessionUpdateSchema = createUpdateSchema(session, {
    expiresAt: z.date().optional(),
    token: z.string().min(1).optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    userId: z.string().min(1).optional(),
});

export type SessionUpdateValues = z.infer<typeof sessionUpdateSchema>;

export type Session = typeof session.$inferSelect;