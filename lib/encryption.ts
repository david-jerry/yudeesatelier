import crypto from "crypto";
import { genSalt, hash, compare as verify } from "bcrypt-ts";
import { config } from "@/config";
import { CLogger } from "./logger";

/**
 * Result structure for symmetric encryption
 */
interface EncryptionResult {
    encryptedData: string;
    iv: string;
    salt: string;
    authTag: string;
}

/**
 * CryptoService: Handles sensitive data protection.
 * - Password Hashing: Bcrypt (Memory-hard, side-channel resistant)
 * - File/Data Encryption: AES-256-GCM (Authenticated Encryption)
 */
export class CryptoService {
    private static instance: CryptoService;
    private readonly algorithm = "aes-256-gcm";
    private readonly secretKey: string;

    private constructor() {
        this.secretKey = config.ENC_KEY_1 || config.ENC_KEY_2;
        if (!this.secretKey || this.secretKey.length < 32) {
            throw new Error("SECRET_KEY must be at least 32 characters long.");
        }
    }

    public static getInstance(): CryptoService {
        if (!CryptoService.instance) {
            CryptoService.instance = new CryptoService();
        }
        return CryptoService.instance;
    }

    // --- Password Hashing (Bcrypt) ---

    /**
     * Hashes a password using Bcrypt.
     * Complexity: O(1) time (configurable), O(M) memory.
     * 
     * ### Example Usage
     * ```typescript
     * const hashedPassword = await cryptoService.hashPassword("my_secure_password");
     * console.log("Hashed Password:", hashedPassword);
     * ```
     */
    public async hashPassword(password: string): Promise<string> {
        try {
            const salt = await genSalt(12); // 12 rounds is a good balance for security and performance
            return await hash(password, salt);
        } catch (error) {
            CLogger.error("Failed to hash password with Bcrypt", { error });
            throw error;
        }
    }

    /**
     * Verifies a password against a Bcrypt hash.
     * 
     * ### Example Usage
     * ```typescript
     * const isValid = await cryptoService.verifyPassword("user_input_password", storedHash);
     * if (isValid) {
     *   console.log("Password is valid!");
     * } else {
     *   console.log("Invalid password.");
     * }
     * ```
     */
    public async verifyPassword(password: string, hash: string): Promise<boolean> {
        try {
            return await verify(password, hash);
        } catch (error) {
            CLogger.error("Password verification failed", { error });
            return false;
        }
    }

    // --- Data Encryption (AES-256-GCM) ---

    /**
     * Encrypts a Base64 string or Buffer.
     * Uses Scrypt for key derivation to prevent rainbow table attacks on the secret key.
     * 
     * ### Example Usage
     * ```typescript
     * const { encryptedData, iv, salt, authTag } = cryptoService.encrypt("Sensitive data to encrypt");
     * console.log("Encrypted:", encryptedData);
     * // Store encryptedData, iv, salt, and authTag securely for later decryption
     * ```
     */
    public encrypt(data: string | Buffer): EncryptionResult {
        const buffer = typeof data === "string"
            ? Buffer.from(data.includes("base64,") ? data.split(",")[1] : data, "base64")
            : data;

        const iv = crypto.randomBytes(12);
        const salt = crypto.randomBytes(16);

        // Derive a unique sub-key for this specific operation
        const key = crypto.scryptSync(this.secretKey, salt, 32);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);

        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return {
            encryptedData: encrypted.toString("base64"),
            iv: iv.toString("hex"),
            salt: salt.toString("hex"),
            authTag: authTag.toString("hex"),
        };
    }

    /**
     * Decrypts AES-256-GCM encrypted data.
     * Authenticates the data using the authTag before returning results.
     * 
     * ### Example Usage
     * ```typescript
     * const decryptedData = cryptoService.decrypt(encryptedData, iv, salt, authTag);
     * console.log("Decrypted:", decryptedData);
     * // decryptedData will be the original Base64 string or Buffer
     * ```
     */
    public decrypt(
        encryptedData: string,
        ivHex: string,
        saltHex: string,
        authTagHex: string
    ): string {
        const iv = Buffer.from(ivHex, "hex");
        const salt = Buffer.from(saltHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const encryptedBuffer = Buffer.from(encryptedData, "base64");

        const key = crypto.scryptSync(this.secretKey, salt, 32);
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(encryptedBuffer),
            decipher.final(),
        ]);

        return decrypted.toString("base64");
    }
}

export const cryptoService = CryptoService.getInstance();