import z from "zod";

/**
 * Zod schema for email input validation.
 */
export const emailSchema = z.object({
    email: z.email("Invalid email address").nonempty("Email is required"),
});

export const passwordSchema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .nonempty("Password is required"),
})

/**
 * Zod schema for signup form with email and password.
 */
export const signupSchema = z.object({
    email: z
        .email()
        .min(1, "Email is required"),
    name: z
        .string()
        .min(1, "Name is required"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters"),
});

/**
 * Zod schema for login form with email and password.
 */
export const loginSchema = z.object({
    email: z.email("Invalid email address").nonempty("Email is required"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .nonempty("Password is required"),
});

// Define the schema for OTP form
export const otpSchema = z.object({
    otp: z
        .string()
        .length(6, { message: "Verification code must be 6 digits" })
        .regex(/^\d{6}$/, { message: "Verification code must contain only digits" }),
})

/**
 * Form data type for otp-code-only submission.
 */
export type OTPFormData = z.infer<typeof otpSchema>

/**
 * Form data type for email-only submission.
 */
export type EmailFormData = z.infer<typeof emailSchema>;


/**
 * Form data type for password-only submission.
 */
export type PasswordFormData = z.infer<typeof passwordSchema>;


/**
 * Form data type for signup submission (email + password).
 */
export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Form data type for login submission (email + password).
 */
export type LoginFormData = z.infer<typeof loginSchema>;