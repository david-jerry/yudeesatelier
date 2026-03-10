"use server"

import db from "@/db"
import { product, tag, type Tag, type FullProduct, productImage, productSizeVariant, type ProductImage, type ProductSizeVariant, productMeasurement, ProductUpdateValues, FullProductInsertValues, FullProductUpdateValues } from "@/db/models/product"
import { CLogger } from "@/lib/logger"
import { cacheManager } from "@/lib/redis"
import { APIResponse, PaginatedAPIResponse, PaginatedData } from "@/types/api"
import { desc, eq, and, or, ilike, lt, inArray, asc, lte, sql, exists } from "drizzle-orm"
import { inngest } from "@/inngest/client";
import { revalidatePath } from "next/cache";
import {
    productInsertSchema,
    ProductInsertValues,
    TagInsertValues,
    tagInsertSchema
} from "@/db/models/product";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Data structure for the storefront response
 */
interface StorefrontData {
    products: PaginatedData<FullProduct>;
    featured: FullProduct[];
    tags: Tag[];
}

const PRODUCT_CACHE_TTL = 3600; // 1 hour


interface StorefrontCursorParams {
    limit?: number;
    cursor?: string; // ISO String of createdAt
    search?: string;
    tagSlug?: string;
    maxPrice?: number;
}

/**
 * Fetches the atelier collection. 
 * ONLY 'products' are paginated via cursor. 
 * 'featured' and 'tags' are treated as static storefront context.
 */
export async function getStorefrontData({
    limit = 12,
    cursor,
    maxPrice,
    tagSlug,
    search
}: StorefrontCursorParams = {}): Promise<APIResponse<StorefrontData>> {
    try {
        const productCacheKey = `storefront:products:cursor:${cursor || 'initial'}:q:${search || 'none'}:tag:${tagSlug || 'none'}:maxPrice:${maxPrice || 'none'}`;
        const contextCacheKey = `storefront:context:static`;

        CLogger.info(`[Storefront] Syncing archive. Cursor: ${cursor || 'Head'}`);

        // 1. Fetch Static Context (Tags & Featured)
        const staticContext = await cacheManager.wrap(
            contextCacheKey,
            async () => {
                const [allTags, featured] = await Promise.all([
                    db.query.tag.findMany({ orderBy: [desc(tag.createdAt)] }),
                    db.query.product.findMany({
                        where: eq(product.featured, true),
                        limit: 4,
                        with: {
                            tag: true, // This populates the 'tag' object via tagId
                            images: true,
                            sizeVariants: { with: { measurements: true } }
                        }
                    })
                ]);
                return { allTags, featured };
            },
            3600,
            ["tags_list", "featured_products"]
        );

        // 2. Fetch Paginated Products
        const productData = await cacheManager.wrap(
            productCacheKey,
            async () => {
                const filters = [];

                if (cursor) filters.push(lt(product.createdAt, new Date(cursor)));
                if (search) filters.push(ilike(product.name, `%${search}%`));
                if (tagSlug) filters.push(eq(product.tagId, tagSlug));
                if (maxPrice) filters.push(lte(sql`CAST(${product.basePrice} AS NUMERIC)`, maxPrice));

                const results = await db.query.product.findMany({
                    where: and(...filters),
                    with: {
                        tag: true, // Populates Tag object
                        images: true,
                        sizeVariants: { with: { measurements: true } }
                    },
                    limit: limit + 1,
                    orderBy: [desc(product.createdAt)],
                }) as FullProduct[];

                const hasNextPage = results.length > limit;
                const items = hasNextPage ? results.slice(0, limit) : results;
                const nextCursor = hasNextPage
                    ? items[items.length - 1].createdAt.toISOString()
                    : undefined;

                return {
                    records: items,
                    pagination: { nextCursor, hasMore: hasNextPage }
                };
            },
            3600,
            ["products_list"]
        );

        return {
            success: true,
            message: "Atelier archive segment synchronized",
            data: {
                products: productData,
                featured: staticContext.featured,
                tags: staticContext.allTags,
            },
            timestamp: new Date(),
        };
    } catch (error) {
        CLogger.error("[Storefront] Sync failed", { error });
        return {
            success: false,
            message: "Archive locked",
            timestamp: new Date(),
            error_code: "SYNC_ERROR"
        };
    }
}

interface GetProductsParams {
    cursor?: string;       // ISO string of createdAt (e.g. "2025-03-15T14:30:00.000Z")
    limit?: number;
    search?: string;
}

/**
 * Fetches a searchable, paginated list of products for the Admin Archive.
 */
export async function getProducts({
    cursor,
    limit = 10,
    search = "",
}: GetProductsParams): Promise<PaginatedAPIResponse<FullProduct>> {

    // 1. Authorization Guard
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
        CLogger.error(`[Auth] Unauthorized attempt to fetch products list`);
        return { success: false, message: "Unauthorized", timestamp: new Date() };
    }


    const sanitizedSearch = search.trim().toLowerCase();
    const cacheKey = `admin:products:list:${cursor ?? "head"}:limit:${limit}:q:${sanitizedSearch || "none"}`;
    const cacheTags = ["products_list", "admin_products", "admin_dashboard"];

    try {
        CLogger.info(`[Admin] Syncing archive. Search: "${sanitizedSearch || 'none'}"`);

        // Use the .wrap pattern from your working storefront action
        const productData = await cacheManager.wrap(
            cacheKey,
            async () => {
                const filters = [];

                // 1. Working Cursor Logic (Direct from working action)
                if (cursor) {
                    filters.push(lt(product.createdAt, new Date(cursor)));
                }

                // 2. Working Search Logic (Simplified & Robust)
                if (sanitizedSearch) {
                    filters.push(
                        or(
                            ilike(product.name, `%${sanitizedSearch}%`),
                            ilike(product.slug, `%${sanitizedSearch}%`),
                            ilike(product.description, `%${sanitizedSearch}%`),
                            // Price search requires a cast to text to avoid DB errors
                            ilike(sql`CAST(${product.basePrice} AS TEXT)`, `%${sanitizedSearch}%`)
                        )
                    );
                }

                // 3. Database Query
                const results = await db.query.product.findMany({
                    where: filters.length > 0 ? and(...filters) : undefined,
                    with: {
                        tag: true,
                        images: true,
                        sizeVariants: { with: { measurements: true } }
                    },
                    limit: limit + 1,
                    orderBy: [desc(product.createdAt)],
                }) as FullProduct[];

                const hasNextPage = results.length > limit;
                const items = hasNextPage ? results.slice(0, limit) : results;

                const nextCursor = hasNextPage
                    ? items[items.length - 1].createdAt.toISOString()
                    : undefined;

                return {
                    records: items,
                    pagination: {
                        nextCursor,
                        hasMore: hasNextPage,
                        prevCursor: cursor
                    }
                };
            },
            sanitizedSearch ? 300 : 1800, // TTL logic
            cacheTags
        );

        // Return flattened data structure (Matches your APIResponse<T> where T is PaginatedData)
        return {
            success: true,
            message: sanitizedSearch
                ? `Archive segment synchronized for "${search}"`
                : "Admin product archive synchronized",
            data: productData,
            timestamp: new Date(),
        };

    } catch (error) {
        CLogger.error("[Admin Products] Sync failed", { error });
        return {
            success: false,
            message: "Archive segment locked",
            timestamp: new Date(),
            error_code: "SYNC_ERROR",
            data: undefined
        };
    }
}

/**
 * Deletes a product with admin/staff authorization and robust 
 * distributed locking via the CacheManager withLock method.
 */
export async function deleteProduct(id: string): Promise<APIResponse<null>> {
    try {
        // 1. Authorization Guard
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
            CLogger.error(`[Auth] Unauthorized deletion attempt on piece: ${id}`);
            return { success: false, message: "Unauthorized", timestamp: new Date() };
        }

        // 2. Use the CacheManager withLock wrapper for the critical section
        // This handles acquisition, retries, and safe release automatically.
        return await cacheManager.withLock(`product:delete:${id}`, async () => {
            CLogger.info(`[Admin] Decommissioning piece: ${id} (Admin: ${session.user.id})`);

            // Fetch for relational invalidation
            const piece = await db.query.product.findFirst({
                where: eq(product.id, id),
                with: { tag: true }
            });

            if (!piece) {
                return { success: false, message: "Piece not found", timestamp: new Date() };
            }

            // 3. Database Deletion
            await db.delete(product).where(eq(product.id, id));

            // 4. Cache Invalidation using your specific methods
            await purgeProductCaches(id, piece.slug, piece.tag?.slug);

            return {
                success: true,
                message: "Piece successfully removed from archive",
                timestamp: new Date(),
            };
        }, 10000, 5); // 10s TTL, 5 retries

    } catch (error) {
        CLogger.error("[Admin] Delete Failure", { error });
        return {
            success: false,
            message: error instanceof Error ? error.message : "Archive synchronization failed",
            timestamp: new Date(),
            error_code: "DELETE_FAILURE",
        };
    }
}


/**
 * Fetch a single product by slug with caching
 */
export async function getProductBySlug(slug: string): Promise<APIResponse<any>> {
    const cacheKey = `product_detail:${slug}`;

    try {
        const data = await cacheManager.wrap(
            cacheKey,
            async () => {
                CLogger.info(`[DB_HIT] Fetching product detail: ${slug}`);
                return await db.query.product.findFirst({
                    where: eq(product.slug, slug),
                    with: {
                        images: true,
                        sizeVariants: { with: { measurements: true } }
                    }
                });
            },
            PRODUCT_CACHE_TTL,
            [`product:${slug}`]
        );

        if (!data) return { success: false, message: "Not found", timestamp: new Date() };

        return { success: true, message: "Product found", data, timestamp: new Date() };
    } catch (error) {
        return { success: false, message: "Error fetching product", timestamp: new Date() };
    }
}


export async function createTag(values: TagInsertValues): Promise<APIResponse<any>> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.user.isAdmin && !session.user.isStaff) {
        return { success: false, message: "Unauthorized", timestamp: new Date() };
    }

    const validated = tagInsertSchema.parse(values);
    const lockKey = `lock:tag:${validated.slug}`;

    try {
        return await cacheManager.withLock(lockKey, async () => {
            const existing = await db.query.tag.findFirst({
                where: eq(tag.slug, validated.slug)
            });

            if (existing) {
                return { success: false, message: "Tag slug already exists", timestamp: new Date() };
            }

            const [newTag] = await db.insert(tag).values(validated).returning();

            // Invalidate tag list caches
            await cacheManager.invalidateByTag("tags_list");
            return { success: true, message: "Tag created", data: newTag, timestamp: new Date() };
        });
    } catch (error) {
        CLogger.error("Failed to create tag", { error });
        return { success: false, message: "Internal server error", timestamp: new Date() };
    }
}


/**
 * Fetches all tags for form selection with Redis caching.
 * Uses tag-based invalidation for high performance.
 */
export async function getTagsAction(): Promise<APIResponse<Tag[]>> {
    const CACHE_KEY = "tags:all_list"
    const TAG_KEY = "tags"

    try {
        // 1. Attempt to retrieve from Cache
        const cachedTags = await cacheManager.get<Tag[]>(CACHE_KEY)
        if (cachedTags) {
            CLogger.info(`Cache Hit: ${CACHE_KEY}`)
            return {
                success: true,
                message: "Tags retrieved from cache",
                data: cachedTags,
                timestamp: new Date()
            }
        }

        // 2. Database Fetch if cache miss
        CLogger.info(`Cache Miss: ${CACHE_KEY}. Fetching from DB...`)
        const tags = await db.query.tag.findMany({
            orderBy: [asc(tag.name)]
        })

        // 3. Store in Redis with the 'tags' invalidation tag
        await cacheManager.set(CACHE_KEY, tags, 3600, [TAG_KEY])

        return {
            success: true,
            message: "Tags retrieved successfully",
            data: tags,
            timestamp: new Date()
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"

        CLogger.error(`Failed to fetch tags: ${errorMessage}`)

        return {
            success: false,
            message: "Failed to retrieve tags for the product form.",
            timestamp: new Date(),
            error_code: "FETCH_TAGS_ERROR"
        }
    }
}


/**
 * Create a product with nested variants and measurements.
 * Handles on-the-fly tag creation and featured status.
 */
export async function createFullProduct(
    values: FullProductInsertValues,
    base64Images: { base64Data: string, fileName: string }[]
): Promise<APIResponse<any>> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.user.isAdmin && !session.user.isStaff) {
        return { success: false, message: "Unauthorized", timestamp: new Date() };
    }

    // 1. Validation
    const validated = productInsertSchema.parse(values);
    const lockKey = `lock:product:${validated.slug}`;

    try {
        return await cacheManager.withLock(lockKey, async () => {

            const result = await db.transaction(async (tx) => {
                // Check for existing product slug
                const existing = await tx.query.product.findFirst({
                    where: eq(product.slug, validated.slug)
                });

                if (existing) {
                    tx.rollback();
                    return null;
                }

                // 2. Handle Tag Creation (Upsert)
                // If a tag slug was provided, ensure it exists in the 'tag' table
                if (validated.tagId) {
                    await tx.insert(tag)
                        .values({
                            name: validated.tagId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                            slug: validated.tagId,
                        })
                        .onConflictDoNothing(); // If it exists, we just move on
                }

                // 3. Insert Product (includes 'featured' and 'tag' slug)
                const [newProduct] = await tx.insert(product).values({
                    ...validated,
                    featured: values.featured ?? false, // Ensure boolean mapping
                }).returning();

                // 4. Insert Variants & Measurements
                for (const v of values.sizeVariants) {
                    const [variant] = await tx.insert(productSizeVariant).values({
                        productId: newProduct.id,
                        size: v.size,
                        extraAmount: v.extraAmount
                    }).returning();

                    if (v.measurements && v.measurements.length > 0) {
                        await tx.insert(productMeasurement).values(
                            v.measurements.map(m => ({
                                productSizeVariantId: variant.id,
                                key: m.key,
                                value: m.value,
                                unit: m.unit
                            }))
                        );
                    }
                }
                return newProduct;
            });

            if (!result) {
                return { success: false, message: "A piece with this slug already exists.", timestamp: new Date() };
            }

            // 5. Redis Shadow Cache for "Pending" Images
            if (base64Images.length > 0) {
                const shadowCacheKey = `pending_images:${result.id}`;
                await cacheManager.set(
                    shadowCacheKey,
                    base64Images.map(img => img.base64Data),
                    600,
                    ["pending_uploads"]
                );

                // 6. Trigger Inngest for Background Cloudinary Upload
                await inngest.send({
                    name: "file/process.upload",
                    data: {
                        files: base64Images,
                        targetTable: "productImage",
                        urlColumn: "url",
                        idColumn: "urlId",
                        linkColumn: "productId",
                        linkId: result.id,
                        folder: `products/${validated.slug}`,
                    }
                });
                CLogger.info(`[Inngest] Background upload initiated for: ${result.id}`);
            }

            // 7. Global Cache Invalidation
            // We invalidate the specific product, the list, and the tag caches
            await purgeProductCaches(result.id, result.slug, result.tagId ?? undefined);

            return {
                success: true,
                message: "Atelier piece synchronized. Media is processing.",
                data: result,
                timestamp: new Date()
            };
        });
    } catch (error: unknown) {
        CLogger.error("Create Product Failure", error);
        return {
            success: false,
            message: "A database error occurred while creating the piece.",
            timestamp: new Date(),
            error_code: "PRODUCT_CREATE_FAILED"
        };
    }
}


/**
 * Updates product metadata, variants, and measurements atomically.
 * Fields with null/undefined values are ignored to prevent data loss.
 */
export async function updateFullProduct(
    values: FullProductUpdateValues,
    newImages?: { base64Data: string, fileName: string }[],
    imagesToDelete?: string[] // Array of publicIds (urlId in your table)
): Promise<APIResponse<any>> {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || (!session.user.isAdmin && !session.user.isStaff)) {
        return { success: false, message: "Unauthorized", timestamp: new Date() };
    }

    const lockKey = `lock:product_update:${values.id}`;
    const updateData = Object.fromEntries(
        Object.entries(values).filter(([_, v]) => v != null && !["sizeVariants", "images", "id"].includes(_))
    );

    try {
        return await cacheManager.withLock(lockKey, async () => {
            // New: Fetch old product before transaction to detect changes
            const oldProduct = await db.query.product.findFirst({
                where: eq(product.id, values.id)
            });
            const oldSlug = oldProduct?.slug;
            const oldTagSlug = oldProduct?.tagId;  // tag is string in product table


            const result = await db.transaction(async (tx) => {
                // 1. Update Base Metadata
                if (Object.keys(updateData).length > 0) {
                    await tx.update(product).set(updateData).where(eq(product.id, values.id));
                }

                // 2. Sync Variants & Measurements (Upsert Logic)
                if (values.sizeVariants) {
                    for (const v of values.sizeVariants) {
                        let vId = v.id;
                        if (vId) {
                            await tx.update(productSizeVariant)
                                .set({ size: v.size, extraAmount: v.extraAmount })
                                .where(eq(productSizeVariant.id, vId));
                        } else {
                            const [newV] = await tx.insert(productSizeVariant).values({
                                productId: values.id,
                                size: v.size,
                                extraAmount: v.extraAmount
                            }).returning();
                            vId = newV.id;
                        }

                        for (const m of v.measurements) {
                            if (m.id) {
                                await tx.update(productMeasurement)
                                    .set({ key: m.key, value: m.value, unit: m.unit })
                                    .where(eq(productMeasurement.id, m.id));
                            } else {
                                await tx.insert(productMeasurement).values({
                                    productSizeVariantId: vId,
                                    key: m.key, value: m.value, unit: m.unit
                                });
                            }
                        }
                    }
                }

                // 3. Handle Immediate DB Deletions for Images
                if (imagesToDelete && imagesToDelete.length > 0) {
                    await tx.delete(productImage)
                        .where(and(
                            eq(productImage.productId, values.id),
                            inArray(productImage.urlId, imagesToDelete)
                        ));
                }

                return { id: values.id };
            });

            // --- Background Tasks (Non-blocking) ---

            // 4. Handle Cloudinary Deletions via Inngest
            if (imagesToDelete && imagesToDelete.length > 0) {
                await inngest.send({
                    name: "file/delete.cloud",
                    data: { publicIds: imagesToDelete }
                });
            }

            // 5. Handle New Uploads with Shadow Cache
            if (newImages && newImages.length > 0) {
                const shadowKey = `pending_images:${values.id}`;
                await cacheManager.set(shadowKey, newImages.map(i => i.base64Data), 600);

                await inngest.send({
                    name: "file/process.upload",
                    data: {
                        files: newImages,
                        targetTable: "productImage",
                        urlColumn: "url",
                        idColumn: "urlId",
                        linkColumn: "productId",
                        linkId: values.id,
                        folder: `products/${values.slug || 'updates'}`,
                    }
                });
            }

            // 6. Proficient Cache Invalidation
            await purgeProductCaches(
                values.id,
                values.slug ?? oldSlug,  // Use new if provided, else old
                values.tagId || oldTagSlug || undefined,  // Use new if provided, else old
                oldSlug,  // Pass old for change detection
                oldTagSlug || undefined  // Pass old for change detection
            );

            return {
                success: true,
                message: "Product records and asset sync updated.",
                data: result,
                timestamp: new Date()
            };
        });
    } catch (error) {
        CLogger.error("Critical update failure", { error });
        return { success: false, message: "Update failed", timestamp: new Date(), error_code: "PRODUCT_UPDATE_ERR" };
    }
}


/**
 * Standardized invalidator to ensure Storefront and Admin stay in sync.
 */
async function purgeProductCaches(
    productId?: string,
    slug?: string,
    tagSlug?: string,
    oldSlug?: string,  // New: Optional old slug for handling updates where slug changes
    oldTagSlug?: string  // New: Optional old tag slug for handling updates where tag changes
) {
    const tagsToInvalidate = [
        "products_list",       // Paginated lists (Admin & Store)
        "products",            // General product tag
        "featured_products",   // Featured section
        "admin_dashboard",     // Admin specific views
        "tags_list",           // Add: For tag lists (e.g., when new tags are created/upserted)
        "tags"                 // Add: For general tags cache (e.g., in getTagsAction)
    ];
    const keysToInvalidate = [
        "storefront:context:static", // Tags & Featured cache
        "storefront:v1:collection"   // Legacy/Other collection cache
    ];
    // Build promises
    const tasks: Promise<any>[] = [
        ...tagsToInvalidate.map(tag => cacheManager.invalidateByTag(tag)),
        ...keysToInvalidate.map(key => cacheManager.invalidate(key)),
        // 3. Pattern-based invalidation (CRITICAL for paginated lists with search queries)
        // This targets `products:admin:list:*` to catch all permutations of cursor/limit/q
        cacheManager.invalidatePattern("products:admin:list:*"),
        cacheManager.invalidatePattern("products:list:*"),
        cacheManager.invalidatePattern("storefront:products:*")  // Add: Explicitly cover all storefront product variations
    ];
    // Targeted invalidations
    if (productId) tasks.push(cacheManager.invalidateByTag(`product:${productId}`));
    if (slug) tasks.push(cacheManager.invalidateByTag(`product:${slug}`));
    if (tagSlug) tasks.push(cacheManager.invalidateByTag(`tag_products:${tagSlug}`));
    // New: Handle old values if provided (for updates)
    if (oldSlug && oldSlug !== slug) {
        tasks.push(cacheManager.invalidateByTag(`product:${oldSlug}`));
    }
    if (oldTagSlug && oldTagSlug !== tagSlug) {
        tasks.push(cacheManager.invalidateByTag(`tag_products:${oldTagSlug}`));
    }
    await Promise.all(tasks);
    // Refresh Next.js Cache
    revalidatePath("/");
    revalidatePath("/dashboard/products");
    revalidatePath("/(store)", "layout");
}