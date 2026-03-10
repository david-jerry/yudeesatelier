import { index, pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { abstract } from "../helpers/abstract";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod";
import { Session, session } from "./session";
import { Account, account } from "./account";
import { Passkey, passkey } from "./passkey";
import { Wallet, wallet } from "./wallet";
import { Order, order } from "./order";
import { Wishlist, wishlist } from "./wishlist";
import { Review, review } from "./reviews";

export const user = pgTable(
    "user",
    {
        name: text("name").notNull(),
        email: text("email").notNull().unique(),
        emailVerified: boolean("email_verified").default(false).notNull(),
        image: text("image").default("https://placehold.co/400"),
        imagePublicId: text("user_image_public_id"),
        subscribed: boolean("subscribed").default(false),
        isAdmin: boolean("is_admin").default(false),
        isStaff: boolean("is_staff").default(false),
        isBanned: boolean("is_banned").default(false),
        ...abstract,
    },
    (table) => [
        index("user_created_at_idx").on(table.createdAt),
        index("user_email_idx").on(table.email),
    ]
);

export const verification = pgTable(
    "verification",
    {
        identifier: text("identifier").notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        ...abstract,
    },
    (table) => [
        index("verification_created_at_idx").on(table.createdAt),
        index("verification_identifier_idx").on(table.identifier),
    ]
);

export const userRelations = relations(user, ({ one, many }) => ({
    sessions: many(session),
    accounts: many(account),
    passkeys: many(passkey),
    orders: many(order),
    wishlists: many(wishlist),
    wallet: one(wallet, {
        fields: [user.id],
        references: [wallet.userId],
    }),
    review: one(review, {
        fields: [user.id],
        references: [review.userId],
    }),
}));

export const userInsertSchema = createInsertSchema(user, {
    name: z.string().min(1),
    email: z.email(),
    image: z.url().optional(),
});

export const userUpdateSchema = createUpdateSchema(user, {
    name: z.string().min(1).optional(),
    email: z.email().optional(),
    image: z.url().optional(),
});

export type User = typeof user.$inferSelect;
export type Verification = typeof verification.$inferSelect;

export type FullUserResponse = User & {
    sessions: Session[],
    accounts: Account[],
    passkeys: Passkey[],
    wallet: Wallet | null,
    orders: Order[],
    wishlists: Wishlist[],
    review: Review,
}

export type FullUserInsertValues = z.infer<typeof userInsertSchema>
export type FullUserUpdateValues = z.infer<typeof userUpdateSchema>