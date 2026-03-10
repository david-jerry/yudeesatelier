import { index, numeric, pgTable, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { abstract } from "../helpers/abstract";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod";
import { review } from "./reviews";
import { wishlist } from "./wishlist";

export const productSizeVariantEnum = pgEnum("product_size_variant_enum", ["XS", "S", "M", "L", "XL", "XXL", "OS"]);
export type ProductSizeVariantEnum = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "OS";
export const productMeasurementUnitEnum = pgEnum("product_measurement_unit_enum", ["cm", "in"]);
export type ProductMeasurementUnitEnum = "cm" | "in";


export const tag = pgTable(
    "tag",
    {
        name: text("name").notNull().unique(),
        slug: text("slug").notNull().unique(),
        ...abstract,
    },
    (table) => [
        index("tag_created_at_idx").on(table.createdAt),
        index("tag_name_idx").on(table.name),
        index("tag_slug_idx").on(table.slug),
    ]
);

export const product = pgTable(
    "product",
    {
        name: text("name").notNull().unique(),
        slug: text("slug").notNull().unique(),
        description: text("description"),
        basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
        quantity: numeric("quantity").notNull().default("1"),
        featured: boolean("featured").notNull().default(false),
        tagId: text("tag_id").references(() => tag.slug, { onDelete: "set null" }),
        ...abstract,
    },
    (table) => [
        index("product_created_at_idx").on(table.createdAt),
        index("product_name_idx").on(table.name),
        index("product_slug_idx").on(table.slug),
    ]
);

export const productImage = pgTable(
    "product_image",
    {
        url: text("url").notNull(),
        urlId: text("url_id").notNull().unique(),
        productId: text("product_id")
            .notNull()
            .references(() => product.id, { onDelete: "cascade" }),
        ...abstract,
    },
    (table) => [
        index("product_image_created_at_idx").on(table.createdAt),
        index("product_image_product_id_idx").on(table.productId),
    ]
);
export const productSizeVariant = pgTable(
    "product_size_variant",
    {
        productId: text("product_id")
            .notNull()
            .references(() => product.id, { onDelete: "cascade" }),
        size: productSizeVariantEnum("size").default("M").notNull(),
        extraAmount: numeric("extra_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
        ...abstract,
    },
    (table) => [
        index("product_size_variant_created_at_idx").on(table.createdAt),
        index("product_size_variant_product_id_idx").on(table.productId),
    ]
);

export const productMeasurement = pgTable(
    "product_measurement",
    {
        productSizeVariantId: text("product_size_variant_id")
            .notNull()
            .references(() => productSizeVariant.id, { onDelete: "cascade" }),
        key: text("key").notNull().default("height"),
        value: numeric("value", { precision: 10, scale: 2 }).notNull().default("0.00"),
        unit: productMeasurementUnitEnum("unit").notNull().default("cm"),
        ...abstract,
    },
    (table) => [
        index("product_measurement_created_at_idx").on(table.createdAt),
        index("product_measurement_product_size_variant_id_idx").on(table.productSizeVariantId),
    ]
);

export const productDiscount = pgTable(
    "product_discount",
    {
        percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
        code: text("code").notNull().unique(),
        usage: numeric("usage").notNull().default("1"),
        expires: timestamp("expires").notNull(),
        ...abstract,
    },
    (table) => [
        index("product_discount_created_at_idx").on(table.createdAt),
        index("product_discount_code_idx").on(table.code),
    ]
);

// Relationships
export const tagRelations = relations(tag, ({ many }) => ({
    products: many(product),
}));

export const productRelations = relations(product, ({ one, many }) => ({
    tag: one(tag, {
        fields: [product.tagId],
        references: [tag.slug],
    }),
    images: many(productImage),
    sizeVariants: many(productSizeVariant),
    wishlists: many(wishlist),
}));

export const productImageRelations = relations(productImage, ({ one }) => ({
    product: one(product, {
        fields: [productImage.productId],
        references: [product.id],
    }),
}));

export const productSizeVariantRelations = relations(productSizeVariant, ({ one, many }) => ({
    product: one(product, {
        fields: [productSizeVariant.productId],
        references: [product.id],
    }),
    measurements: many(productMeasurement),
}));

export const productMeasurementRelations = relations(productMeasurement, ({ one }) => ({
    productSizeVariant: one(productSizeVariant, {
        fields: [productMeasurement.productSizeVariantId],
        references: [productSizeVariant.id],
    }),
}));

// Validation Schemas using Zod

export const tagInsertSchema = createInsertSchema(tag, {
    name: z.string().min(1),
});

export type TagInsertValues = z.infer<typeof tagInsertSchema>;

export const tagUpdateSchema = createUpdateSchema(tag, {
    name: z.string().min(1).optional(),
});

export type TagUpdateValues = z.infer<typeof tagUpdateSchema>;


export const productInsertSchema = createInsertSchema(product, {
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    featured: z.boolean().optional(),
    basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
    tagId: z.string().min(1).optional(),
});

export type ProductInsertValues = z.infer<typeof productInsertSchema>;

export const productUpdateSchema = createUpdateSchema(product, {
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional(),
    basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    featured: z.boolean().optional(),
    tag: z.string().min(1).optional(),
});

export type ProductUpdateValues = z.infer<typeof productUpdateSchema>;


export const productImageInsertSchema = createInsertSchema(productImage, {
    url: z.string().min(1),
    urlId: z.string().min(1),
    productId: z.string().min(1),
});

export type ProductImageInsertValues = z.infer<typeof productImageInsertSchema>;

export const productImageUpdateSchema = createUpdateSchema(productImage, {
    url: z.string().min(1).optional(),
    urlId: z.string().min(1).optional(),
    productId: z.string().min(1).optional(),
});

export type ProductImageUpdateValues = z.infer<typeof productImageUpdateSchema>;


export const productDiscountInsertSchema = createInsertSchema(productDiscount, {
    percentage: z.string().regex(/^\d+(\.\d{1,2})?$/),
    code: z.string().min(1),
    usage: z.string().regex(/^\d+$/).optional(),
    expires: z.date(),
});

export type ProductDiscountInsertValues = z.infer<typeof productDiscountInsertSchema>;

export const productDiscountUpdateSchema = createUpdateSchema(productDiscount, {
    percentage: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    code: z.string().min(1).optional(),
    usage: z.string().regex(/^\d+$/).optional(),
    expires: z.date().optional(),
});

export type ProductDiscountUpdateValues = z.infer<typeof productDiscountUpdateSchema>;


export const productSizeVariantInsertSchema = createInsertSchema(productSizeVariant, {
    productId: z.string().min(1),
    size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "OS"]).optional(),
    extraAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export type ProductSizeVariantInsertValues = z.infer<typeof productSizeVariantInsertSchema>;

export const productSizeVariantUpdateSchema = createUpdateSchema(productSizeVariant, {
    productId: z.string().min(1).optional(),
    size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "OS"]).optional(),
    extraAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export type ProductSizeVariantUpdateValues = z.infer<typeof productSizeVariantUpdateSchema>;

export const productMeasurementInsertSchema = createInsertSchema(productMeasurement, {
    productSizeVariantId: z.string().min(1),
    key: z.string().min(1).optional(),
    value: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    unit: z.enum(["cm", "in"]).optional(),
});

export type ProductMeasurementInsertValues = z.infer<typeof productMeasurementInsertSchema>;

export const productMeasurementUpdateSchema = createUpdateSchema(productMeasurement, {
    productSizeVariantId: z.string().min(1).optional(),
    key: z.string().min(1).optional(),
    value: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    unit: z.enum(["cm", "in"]).optional(),
});

export type ProductMeasurementUpdateValues = z.infer<typeof productMeasurementUpdateSchema>;

export const sizeVariantWithMeasurementsSchema = z.object({
    id: z.string().optional(), // For updates, ID is optional (new variants won't have it)
    size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "OS"]),
    extraAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
    measurements: z.array(
        z.object({
            id: z.string().optional(), // For updates, ID is optional (new measurements won't have it)
            key: z.string().min(1),
            value: z.string().regex(/^\d+(\.\d{1,2})?$/),
            unit: z.enum(["cm", "in"]),
        })
    ),
});

export const fullProductInsertSchema = productInsertSchema.extend({
    sizeVariants: z.array(sizeVariantWithMeasurementsSchema),
    images: z.array(
        z.object({
            url: z.string().min(1),
            urlId: z.string().min(1),
        })
    ).optional(),
});

export type FullProductInsertValues = z.infer<typeof fullProductInsertSchema>;

export const fullProductUpdateSchema = productUpdateSchema.extend({
    id: z.string().min(1), // ID is required for updates
    sizeVariants: z.array(
        sizeVariantWithMeasurementsSchema.extend({
            id: z.string().optional(), // For updates, ID is optional (new variants won't have it)
        })
    ).optional(),
    images: z.array(
        z.object({
            url: z.string().min(1),
            urlId: z.string().min(1),
        })
    ).optional(),
});

export type FullProductUpdateValues = z.infer<typeof fullProductUpdateSchema>;
// TypeScript Types for Frontend

export type Product = typeof product.$inferSelect;
export type ProductImage = typeof productImage.$inferSelect;
export type ProductDiscount = typeof productDiscount.$inferSelect;
export type Tag = typeof tag.$inferSelect;
export type ProductSizeVariant = typeof productSizeVariant.$inferSelect;
export type ProductMeasurement = typeof productMeasurement.$inferSelect;
export type ProductWithRelations = Product & {
    images: ProductImage[];
};

/**
 * Represents a size variant with its specific measurements.
 */
export type SizeVariantWithMeasurements = ProductSizeVariant & {
    measurements: ProductMeasurement[];
};

/**
 * The primary product type used across the frontend.
 * Includes all relations required for the "Lumina" storefront.
 */
export type FullProduct = Product & {
    tag: Tag | null; // Include tag relation for easy access to tag name/slug
    images: ProductImage[];
    sizeVariants: SizeVariantWithMeasurements[];
};

/**
 * Simplified structure for the Zustand Cart store.
 */
export interface CartItem {
    productId: string;
    variantId: string;
    name: string;
    price: number; // Converted from string numeric
    image: string;
    size: string;
    quantity: number;
}