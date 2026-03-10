import { index, integer, pgTable, text, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { abstract } from "../helpers/abstract";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod";
import { user } from "./user";

export const passkey = pgTable(
    "passkey",
    {
        name: text("name"),
        publicKey: text("public_key").notNull(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        credentialID: text("credential_id").notNull(),
        counter: integer("counter").notNull(),
        deviceType: text("device_type").notNull(),
        backedUp: boolean("backed_up").notNull().default(false),
        transports: text("transports"),
        aaguid: text("aaguid"),
        ...abstract,
    },
    (table) => [
        index("passkey_created_at_idx").on(table.createdAt),
        index("passkey_user_id_idx").on(table.userId),
    ]
);

export const passkeyRelations = relations(passkey, ({ one }) => ({
    user: one(user, {
        fields: [passkey.userId],
        references: [user.id],
    }),
}));

export const passkeyInsertSchema = createInsertSchema(passkey, {
    name: z.string().optional(),
    publicKey: z.string().min(1),
    userId: z.string().min(1),
    credentialID: z.string().min(1),
    counter: z.coerce.number<number>().int(),
    deviceType: z.string().min(1),
    backedUp: z.boolean(),
    transports: z.string().optional(),
    aaguid: z.string().optional(),
});

export type PasskeyInsertValues = z.infer<typeof passkeyInsertSchema>;

export const passkeyUpdateSchema = createUpdateSchema(passkey, {
    name: z.string().optional(),
    publicKey: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    credentialID: z.string().min(1).optional(),
    counter: z.coerce.number<number>().int().optional(),
    deviceType: z.string().min(1).optional(),
    backedUp: z.boolean().optional(),
    transports: z.string().optional(),
    aaguid: z.string().optional(),
});

export type PasskeyUpdateValues = z.infer<typeof passkeyUpdateSchema>;

export type Passkey = typeof passkey.$inferSelect;