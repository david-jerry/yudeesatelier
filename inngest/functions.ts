/* eslint-disable @typescript-eslint/no-explicit-any */
import { inngest } from "./client";
import sendMail, { sendBulkEmail, SendBulkMailProps, SendMailProps } from "@/lib/mailer"; // Adjust import path based on your project structure
import { config } from "@/config";
import { v2 as cloudinary } from "cloudinary";
import { eq, inArray } from "drizzle-orm";
import db from "@/db";
import * as schemas from "@/db/models";

cloudinary.config({
    cloud_name: config.CLOUDINARY_NAME,
    api_key: config.CLOUDINARY_API,
    api_secret: config.CLOUDINARY_SECRET,
    secure: true,
});

/**
 * Inngest function to send a single email.
 * Triggers on the "marketing/email" event and uses the existing sendMail function.
 * @inngest.function
 * @param {Object} options - Inngest function options.
 * @param {string} options.id - The unique identifier for the function.
 * @param {Object} options.event - The event configuration to trigger the function.
 * @param {string} options.event.event - The event name to listen for.
 * @param {Object} params - Function parameters from Inngest.
 * @param {import("inngest").EventPayload} params.event - The event payload containing data (e.g., email).
 * @param {import("inngest").Step} params.step - The step object for async operations.
 * @example
 * ```typescript
 * // Trigger the function
 * await inngest.send({
 *   name: "marketing/email",
 *   data: { email: "user@example.com" }
 * });
 * ```
 * @returns {Promise<{ message: string }>} A promise resolving to a success message.
 */
export const sendEmailInngest = inngest.createFunction(
    { id: "email", retries: 2 },
    { event: "marketing/email" },
    async ({ event, step }) => {
        // Wait for 1 second before sending (e.g., for rate limiting or delay)
        await step.sleep("wait-a-moment", "1s");

        const { to, html, subject } = event.data;

        const mailProps: SendMailProps = {
            to,
            subject,
            html,
            from: config.FROM_EMAIL,
        };

        try {
            await step.run("send-email", async () => {
                await sendMail(mailProps);
                return { message: `Email sent successfully to ${to}` };
            });
        } catch (error) {
            console.error("Failed to send email:", error);
            throw new Error(`Email sending failed for ${to}: ${error}`);
        }
    }
);

/**
 * Inngest function to send bulk emails.
 * Triggers on the "marketing/bulk-email" event and uses the existing sendBulkEmail function.
 * @inngest.function
 * @param {Object} options - Inngest function options.
 * @param {string} options.id - The unique identifier for the function.
 * @param {Object} options.event - The event configuration to trigger the function.
 * @param {string} options.event.event - The event name to listen for.
 * @param {Object} params - Function parameters from Inngest.
 * @param {import("inngest").EventPayload} params.event - The event payload containing data (e.g., recipients).
 * @param {import("inngest").Step} params.step - The step object for async operations.
 * @example
 * ```typescript
 * // Trigger the function
 * await inngest.send({
 *   name: "marketing/bulk-email",
 *   data: {
 *     subject: "Monthly Newsletter",
 *     html: "<h1>Newsletter</h1><p>Check our updates.</p>",
 *     recipients: [
 *       { email: "user1@example.com", name: "User One" },
 *       { email: "user2@example.com", name: "User Two" }
 *     ]
 *   }
 * });
 * ```
 * @returns {Promise<{ message: string }>} A promise resolving to a success message.
 */
export const sendBulkEmailInngest = inngest.createFunction(
    { id: "bulk-email", retries: 2 },
    { event: "marketing/bulk-email" },
    async ({ event, step }) => {
        // Wait for 1 second before sending bulk emails (e.g., to stagger requests)
        await step.sleep("wait-a-moment", "1s");

        const { subject, html, recipients, attachment } = event.data;

        const mailProps: SendBulkMailProps = {
            subject,
            html,
            recipients,
            attachment,
            from: config.FROM_EMAIL, // Default from email from config
        };

        try {
            await sendBulkEmail(mailProps);
            return { message: `Bulk email sent successfully to ${recipients.length} recipients` };
        } catch (error) {
            console.error("Failed to send bulk email:", error);
            throw new Error(`Bulk email sending failed: ${error}`);
        }
    }
);

/**
 * Inngest function for handling Cloudinary uploads in background
 */
type SchemaTables = typeof schemas;
type TableName = keyof {
    [K in keyof SchemaTables as SchemaTables[K] extends import("drizzle-orm/pg-core").PgTableWithColumns<any>
    ? K
    : never]: any;
};

export const dynamicCloudinaryUpload = inngest.createFunction(
    { id: "dynamic-file-upload", retries: 2 },
    { event: "file/process.upload" },
    async ({ event, step }) => {
        const {
            files,           // Array of { base64Data: string, fileName: string }
            targetTable,     // e.g., "productImage"
            urlColumn,       // e.g., "url"
            idColumn,        // e.g., "urlId" (for Cloudinary public_id)
            linkColumn,      // e.g., "productId"
            linkId,          // The actual UUID/ID value
            isRestricted = false,
            folder = "clothes_store",
        } = event.data as {
            files: Array<{ base64Data: string; fileName: string }>;
            targetTable: TableName;
            urlColumn: string;
            idColumn: string;
            linkColumn: string;
            linkId: string;
            isRestricted?: boolean;
            folder?: string;
        };

        // Inside your Inngest dynamicCloudinaryUpload function
        

        // 1. Cloudinary Upload Phase
        const uploadResults = await step.run("cloudinary-upload", async () => {
            const promises = files.map(async (file) => {
                const result = await cloudinary.uploader.upload(file.base64Data, {
                    folder,
                    resource_type: "auto",
                    access_control: isRestricted ? [{ access_type: "token" }] : undefined,
                });

                return {
                    [urlColumn]: result.secure_url,
                    [idColumn]: result.public_id,
                };
            });
            return Promise.all(promises);
        });

        // 2. Dynamic Drizzle Update Phase
        await step.run("db-sync", async () => {
            const table = (schemas as any)[targetTable];
            if (!table) {
                throw new Error(`Table ${targetTable} was not found in the provided schema.`);
            }

            // Determine if this is a one-to-many (insert) or one-to-one (update)
            // For your 'productImage' table, it's a many-to-one relationship, so we insert.
            const shouldInsert = targetTable === "productImage" || uploadResults.length > 1;

            if (shouldInsert) {
                const rowsToInsert = uploadResults.map((res) => ({
                    ...res,
                    [linkColumn]: linkId,
                }));

                await db.insert(table).values(rowsToInsert);
            } else {
                const updateData = {
                    ...uploadResults[0],
                    [linkColumn]: linkId,
                };

                await db
                    .update(table)
                    .set(updateData)
                    .where(eq(table[linkColumn], linkId));
            }
        });

        console.info(`Successfully processed ${files.length} files for ${targetTable} linked to ${linkId}`);

        return {
            success: true,
            count: uploadResults.length
        };
    }
);

/**
 * Inngest function to handle asset deletion from Cloudinary and DB cleanup.
 * Triggers on "file/delete.cloud"
 */
export const deleteCloudinaryAssets = inngest.createFunction(
    { id: "delete-cloudinary-assets", retries: 3 },
    { event: "file/delete.cloud" },
    async ({ event, step }) => {
        const { publicIds } = event.data as { publicIds: string[] };

        if (!publicIds || publicIds.length === 0) {
            return { message: "No assets provided for deletion" };
        }

        // 1. Remove from Cloudinary
        await step.run("cloudinary-delete", async () => {
            const results = await Promise.all(
                publicIds.map((id) => cloudinary.uploader.destroy(id))
            );

            const failed = results.filter((r) => r.result !== "ok" && r.result !== "not found");
            if (failed.length > 0) {
                console.error("Some Cloudinary deletions failed:", failed);
            }
            return results;
        });

        // 2. Database Cleanup
        // In your server action, you already deleted from DB, but this step
        // acts as a safety net to ensure consistency.
        await step.run("db-cleanup", async () => {
            const { productImage } = schemas as any;
            if (!productImage) return { skipped: true };

            // Ensure we remove any remaining references by urlId (publicId)
            await db
                .delete(productImage)
                .where(inArray(productImage.urlId, publicIds));

            return { success: true };
        });

        console.info(`[Inngest] Asset cleanup complete for: ${publicIds.join(", ")}`);

        return {
            success: true,
            deletedCount: publicIds.length,
        };
    }
);