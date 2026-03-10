export const config = {
    TITLE: "Yudee's Atelier",
    NODE_ENV: process.env.NODE_ENV || "development",

    // Security and Environment
    ENC_KEY_1: process.env.ENC_KEY_1 || 'fallback-system-secret-key-one-@123',
    ENC_KEY_2: process.env.ENC_KEY_2 || 'fallback-system-secret-key-two-#456',
    
    // Application URLs and Emails
    TRUSTED_ORIGINS: process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS?.split(",") : ["http://localhost:3000", "http://127.0.0.1:3000", "https://yudeesatelier.vercel.app"],
    BASE_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_BASE_URL || "https://yudeesatelier.vercel.app",
    DOMAIN: process.env.DOMAIN || "https://yudeesatelier.vercel.app",
    NEXT_PUBLIC_DOMAIN: process.env.DOMAIN || "https://yudeesatelier.vercel.app",
    
    // Email Configuration
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "jeremiahedavid@gmail.com",
    FROM_EMAIL: process.env.FROM_EMAIL || "Yudee's Atelier <jeremiahedavid@gmail.com>",
    GMAIL_USER: process.env.NODE_MAILER_GMAIL_APP_USERNAME,
    GMAIL_PASS: process.env.NODE_MAILER_GMAIL_APP_PASSWORD,
    
    // Database and Cache
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/yudees_atelier_ui",
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
    
    // Company Information
    ADDRESS: process.env.ADDRESS || "123 Financial District, Suite 100",
    CITY: process.env.CITY || "San Francisco",
    STATE: process.env.STATE || "Texas",
    ZIP_CODE: process.env.ZIP_CODE || "20101",
    EMAIL_COMPLAINTS: process.env.SUPPORT_EMAIL || "complaints@yudeesatelier.com",
    PHONE_NUMBER: process.env.PHONE_NUMBER || "+1 (234) 384 7729",

    // Third-Party Service Keys
    CLOUDINARY_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_NAME,
    CLOUDINARY_API: process.env.NEXT_PUBLIC_CLOUDINARY_API,
    CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET,

    // Arcjet 
    ARCJET_API_KEY: process.env.ARCJET_API_KEY,
    
    // Paystack 
    PAYSTACK_SK: process.env.TEST_SECRET_KEY,
    PAYSTACK_PK: process.env.TEST_PUBLIC_KEY,
}