/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';
import { config } from '@/config';

/**
 * The wrapper for all Paystack Webhook events
 */
export type PaystackWebhookPayload = {
    function: "subscription" | "rent" 
    event: 'charge.success' | 'transfer.success' | 'transfer.failed' | 'transfer.reversed' | string;
    data: Extract<PaystackVerificationResponse, { status: true }>['data'];
};

type BaseResponse<T> =
    | { status: true; message: string; data: T }
    | { status: false; message: string };

// Internal Statuses for transactions
export type PaystackStatus = 'success' | 'failed' | 'abandoned' | 'ongoing' | 'reversed';

/**
 * RESPONSE: Transaction Initialization
 */
export type PaystackInitializeResponse = BaseResponse<{
    authorization_url: string;
    access_code: string;
    reference: string;
}>;

/**
 * RESULT: App-level Initialization Result
 */
export type InitializePaymentResult =
    | { status: true; data: { authorization_url: string; access_code: string; reference: string }; error?: never }
    | { status: false; error: string; data?: never };

/**
 * RESPONSE: Transaction Verification
 */
export type PaystackVerificationResponse = BaseResponse<{
    id: number;
    domain: string;
    status: PaystackStatus;
    reference: string;
    receipt_number: string | null;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: 'NGN' | 'USD' | string;
    ip_address: string;
    /** Note: Paystack usually returns metadata as a JSON string or an object depending on initialization */
    metadata: string | Record<string, any> | null;
    log: {
        start_time: number;
        time_spent: number;
        attempts: number;
        errors: number;
        success: boolean;
        mobile: boolean;
        input: any[];
        history: Array<{ type: string; message: string; time: number }>;
    } | null;
    fees: number;
    fees_split: any | null;
    authorization: {
        authorization_code: string;
        bin: string;
        last4: string;
        exp_month: string;
        exp_year: string;
        channel: string;
        card_type: string;
        bank: string;
        country_code: string;
        brand: string;
        reusable: boolean;
        signature: string;
        account_name: string | null;
    };
    customer: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        email: string;
        customer_code: string;
        phone: string | null;
        metadata: any | null;
        risk_action: string;
        international_format_phone: string | null;
    };
    plan: string | null;
    split: Record<string, any>;
    order_id: string | null;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any | null;
    source: any | null;
    fees_breakdown: any | null;
    connect: any | null;
    transaction_date: string;
    plan_object: Record<string, any>;
    subaccount: Record<string, any>;
}>;

export type PaystackVerificationErrorResponse = {
    status: false;
    message: string;
};

/**
 * Using a Discriminated Union for the Result pattern.
 * This makes handling the 'if (status)' logic in your code much cleaner.
 */
export type VerificationResult =
    | { status: true; data: Extract<PaystackVerificationResponse, { status: true }>['data']; error?: never }
    | { status: false; error: string; data?: never };

/**
 * Paystack Transaction Statuses
 * Defined as a specific union type for strict string checking.
 */
export type TransactionStatus =
    | 'success'
    | 'failed'
    | 'abandoned'
    | 'pending'
    | 'reversed';

/**
 * OPTIONAL: Helper for Paystack Metadata
 * Useful for ensuring you always have access to userId/planId
 * during the verification phase.
 */
export interface PaystackMetadata {
    userId: string;
    planId: string;
    organizationId?: string;
    [key: string]: any;
}

/**
 * Initializes a transaction with Paystack.
 * Returns the authorization URL where the user should be redirected.
 */
export async function initializePayment({
    email,
    amount,
    metadata, // Optional: useful for passing planId or userId
    currency = 'NGN',
    callbackUrl, // Optional: if you want to specify a callback URL
}: {
    email: string;
    amount: number;
    metadata?: Record<string, any>;
    currency?: string;
    callbackUrl?: string;
}): Promise<InitializePaymentResult> {
    try {
        // 1. Basic Validation
        if (!email || !amount || amount <= 0) {
            return { status: false, error: 'Valid email and positive amount are required' };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { status: false, error: 'Invalid email format' };
        }
        // 2. Prepare Payload (Paystack expects amount in kobo/cents as string)
        const amountInSubunit = Math.round(amount * 100).toString();
        const metadataString = metadata ? JSON.stringify(metadata) : undefined;
        // 3. API Request
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.PAYSTACK_SK}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: amountInSubunit,
                currency,
                metadata: metadataString,
                callback_url: callbackUrl, // Optional: Paystack will redirect here after payment
            }),
            cache: 'no-store',
        });
        // 4. Handle HTTP Errors
        if (!response.ok) {
            const errorText = await response.json();
            return {
                status: false,
                error: errorText.message || 'Payment gateway connection failed',
            };
        }
        const result: PaystackInitializeResponse = await response.json();
        // 5. Check Paystack specific status
        if (result.status) {
            return {
                status: true,
                data: {
                    authorization_url: result.data.authorization_url,
                    access_code: result.data.access_code,
                    reference: result.data.reference,
                },
            };
        }
        return {
            status: false,
            error: result.message || 'Initialization failed',
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
            status: false,
            error: `Unexpected error: ${errorMessage}`,
        };
    }
}

export async function isPaymentSuccessful(
    response: InitializePaymentResult
): Promise<boolean> {
    return response.status === true;
}

export async function chargeAuthorization({
    email,
    amount,
    authorizationCode,
    metadata,
    currency = 'NGN',
    idempotencyKey,
}: {
    email: string;
    amount: number;
    authorizationCode: string;
    metadata?: any;
    currency?: string;
    idempotencyKey?: string; 
}) {
    // Paystack expects the amount in kobo/cents (subunits)
    const amountInSubunit = Math.round(amount * 100).toString();
    const metadataString = metadata ? JSON.stringify(metadata) : undefined;

    const headers: Record<string, string> = {
        Authorization: `Bearer ${config.PAYSTACK_SK}`,
        'Content-Type': 'application/json',
    };

    // If an idempotency key is provided, add it to the headers
    // This is the primary defense against double-charging during network retries
    if (idempotencyKey) {
        headers['x-idempotency-key'] = idempotencyKey;
    }

    const response = await fetch('https://api.paystack.co/transaction/charge_authorization', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            email,
            amount: amountInSubunit,
            authorization_code: authorizationCode,
            currency,
            metadata: metadataString,
        }),
    });

    const result = await response.json();

    // Log the Paystack request ID for tracing in case of disputes
    const paystackRequestId = response.headers.get('x-paystack-request-id');
    if (!response.ok) {
        console.error(`[PaystackChargeError] ID: ${paystackRequestId}`, result);
    }

    return result as PaystackVerificationResponse;
}
/**
 * Verifies a transaction with Paystack using the modern Fetch API.
 * This is designed to be used within your server actions after
 * a user completes a payment on the frontend.
 */
export async function verifyPayment(reference: string): Promise<VerificationResult> {
    try {
        const response = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${config.PAYSTACK_SK}`,
                    'Content-Type': 'application/json',
                },
                // Next.js specific: ensures we don't cache verification results
                cache: 'no-store',
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            return {
                status: false,
                error: errorData.message || 'Network response was not ok',
            };
        }
        const result: PaystackVerificationResponse = await response.json();
        if (result.status && result.data.status === 'success') {
            return {
                status: true,
                data: result.data,
            };
        }
        return {
            status: false,
            error: result.message || 'Payment verification failed',
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            status: false,
            error: `Unexpected error: ${errorMessage}`,
        };
    }
}

/**
 * Type guard to ensure the payment was not only successful in terms of the API call,
 * but that the transaction itself reached the 'success' state.
 */
export async function isVerificationSuccessful(
    response: VerificationResult
): Promise<boolean> {
    return (
        response.status === true &&
        response.data !== undefined &&
        response.data.status === 'success'
    );
}

/**
 * Stricter check to ensure the Paystack transaction is finalized and successful.
 * This filters out 'abandoned', 'failed', or 'ongoing' states.
 */
export async function isTransactionSuccessful(
    transaction?: Extract<PaystackVerificationResponse, { status: true }>['data'] | null
): Promise<boolean> {
    return !!transaction && transaction.status === 'success';
}