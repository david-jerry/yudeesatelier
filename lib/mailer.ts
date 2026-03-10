/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "@/config";
import nodemailer from "nodemailer";
import SMTPPool from "nodemailer/lib/smtp-pool";
import { CLogger } from "./logger";


declare global {
    var transportMailer: nodemailer.Transporter<SMTPPool.SentMessageInfo, SMTPPool.Options>;
}

/**
 * Global transporter instance initialized with Gmail SMTP settings.
 * Uses a singleton pattern via `globalThis.transportMailer` to avoid reinitialization.
 */
const transporter =
    globalThis.transportMailer ??
    nodemailer.createTransport({
        service: "gmail",
        pool: true,
        auth: {
            user: config.GMAIL_USER,
            pass: config.GMAIL_PASS,
        },
        maxMessages: Infinity, // Allow an unlimited number of messages per connection
        maxConnections: 5, // Limit the number of simultaneous connections
    });

if (!globalThis.transportMailer) globalThis.transportMailer = transporter;

/**
 * Sends a single email using the configured transporter.
 * @param {SendMailProps} props - The email properties.
 * @example
 * ```typescript
 * await sendMail({
 *   to: "recipient@example.com",
 *   subject: "Welcome to Our Service",
 *   html: "<h1>Hello!</h1><p>Welcome to our platform.</p>",
 *   attachment: [{
 *     filename: "welcome.pdf",
 *     path: "/path/to/welcome.pdf",
 *     contentType: "application/pdf"
 *   }]
 * });
 * ```
 * @returns {Promise<void>} Resolves when the email is sent, logs success or error.
 */
const sendMail = async (props: SendMailProps): Promise<void> => {
    return await transporter
        .sendMail({ ...props, from: props.from ?? config.FROM_EMAIL })
        .then((results) => {
            CLogger.info(
                `[MAIL] emails sent successfully to: ${results.envelope.to} - ${results.messageId}`
            );
        })
        .catch((errors: any) => {
            CLogger.error("[MAIL] ERROR:: Failed to send email:", { errors });
        });
};

/**
 * Sends bulk emails to multiple recipients using the configured transporter.
 * @param {SendBulkMailProps} props - The bulk email properties.
 * @example
 * ```typescript
 * await sendBulkEmail({
 *   subject: "Monthly Newsletter",
 *   html: "<h1>Newsletter</h1><p>Check out our latest updates.</p>",
 *   recipients: [
 *     { email: "user1@example.com", name: "User One" },
 *     { email: "user2@example.com", name: "User Two" }
 *   ],
 *   attachment: [{
 *     filename: "newsletter.pdf",
 *     content: Buffer.from("PDF content"),
 *     contentType: "application/pdf",
 *     cid: "newsletter@cid"
 *   }]
 * });
 * ```
 * @returns {Promise<void>} Resolves when all emails are sent, logs success or error.
 */
export const sendBulkEmail = async (props: SendBulkMailProps): Promise<void> => {
    const emailPromises = props.recipients.map(async (recipient) => {
        await transporter.sendMail({
            ...props,
            to: `${recipient.name} <${recipient.email}>`,
        });
    });

    Promise.all(emailPromises)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .then((results) => {
            CLogger.info(`[BULK MAIL]:: All emails sent successfully`);
        })
        .catch((errors) => {
            CLogger.error("[BULK MAIL]:: Failed to send one or more emails:", { errors });
        });
};

export default sendMail;





// -------------------------------------------
//          TYPES
// -------------------------------------------
/**
 * Defines the structure for a single mail attachment.
 * NodeMailer accepts content as a Buffer, Stream, or file path.
 * @property {string} filename - The name of the attachment file.
 * @property {any} [content] - The content of the attachment (string, Buffer, or Stream).
 * @property {string} [path] - The file path on disk for the attachment.
 * @property {string} [contentType] - The MIME type of the attachment (e.g., "application/pdf").
 * @property {string} [cid] - Content-ID for embedding images in HTML (e.g., for inline images).
 */
export interface MailAttachment {
    filename: string;
    content?: unknown;
    path?: string;
    contentType?: string;
    cid?: string;
}

/**
 * Defines the structure for a recipient of an email.
 * @property {string} email - The email address of the recipient.
 * @property {string} name - The name of the recipient.
 */
export interface Recipient {
    email: string;
    name: string;
}

/**
 * Properties for sending a single email.
 * @property {string} [from] - The sender's email address (defaults to config.FROM_EMAIL if not provided).
 * @property {string} to - The recipient's email address.
 * @property {string} subject - The subject line of the email.
 * @property {string} html - The HTML content of the email.
 * @property {MailAttachment[]} [attachment] - Optional array of attachments.
 */
export interface SendMailProps {
    from?: string;
    to: string;
    subject: string;
    html: string;
    attachment?: MailAttachment[];
}

/**
 * Properties for sending bulk emails.
 * @property {string} [from] - The sender's email address (defaults to config.FROM_EMAIL if not provided).
 * @property {string} subject - The subject line of the email.
 * @property {string} html - The HTML content of the email.
 * @property {MailAttachment[]} [attachment] - Optional array of attachments.
 * @property {Recipient[]} recipients - Array of recipient objects.
 */
export interface SendBulkMailProps {
    from?: string;
    subject: string;
    html: string;
    attachment?: MailAttachment[];
    recipients: Recipient[];
}