import { config } from "@/config";
import type { Metadata } from "next/types";

/**
 * Creates a metadata object by merging the provided override with default values.
 * The function enhances the metadata with Open Graph and Twitter card settings for SEO and social sharing.
 * @param {Metadata} override - The metadata object to override defaults (e.g., title, description).
 * @example
 * ```typescript
 * const customMetadata = createMetadata({
 *   title: "Abodex Dashboard",
 *   description: "Manage your property with ease.",
 *   openGraph: {
 *     images: ["https://custom-image.jpg"]
 *   }
 * });
 * // Returns merged metadata with defaults and custom openGraph images
 * ```
 * @returns {Metadata} The merged metadata object with Open Graph and Twitter settings.
 */
export function createMetadata(override: Metadata): Metadata {
    return {
        ...override,
        openGraph: {
            title: override.title ?? undefined,
            description: override.description ?? undefined,
            url: "https://yudeesatelier.store/",
            images: "https://yudeesatelier.store/logo-primary.svg",
            siteName: config.TITLE,
            ...override.openGraph,
        },
        twitter: {
            card: "summary_large_image",
            creator: "@yudeesatelier",
            title: override.title ?? undefined,
            description: override.description ?? undefined,
            images: "https://yudeesatelier.store/logo-primary.svg",
            ...override.twitter,
        },
    };
}

/**
 * Generates the base URL for the application based on the environment.
 * Uses localhost in development mode; otherwise, uses the configured BASE_URL.
 * @example
 * ```typescript
 * console.log(baseUrl); // Outputs: http://localhost:3000 in dev, https://yudeesatelier.store/ in prod
 * ```
 * @returns {URL} The base URL as a URL object.
 */
export const baseUrl =
    config.NODE_ENV !== "production"
        ? new URL("http://localhost:3000")
        : new URL(config.BASE_URL);