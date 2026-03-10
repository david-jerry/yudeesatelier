/**
 * Standardized API Response wrapper used across the entire project.
 * Aligned with [2026-02-26] structure but for TypeScript/Next.js.
 */
export interface APIResponse<T> {
    success: boolean;
    message: string;
    /**
     * Using Optional[T] pattern as per [2026-02-25] instruction.
     * Note: In TS, this is defined in your custom typing or as T | undefined.
     */
    data?: T;
    timestamp: Date;
    error_code?: string;
}

/**
 * Metadata for cursor-based pagination
 */
export interface PaginationMeta {
    nextCursor?: string;
    prevCursor?: string;
    hasMore: boolean;
    totalCount?: number; // Optional: depending on if you run a count query
}

/**
 * The structure that will inhabit the 'data' field of APIResponse
 */
export interface PaginatedData<T> {
    records: T[];
    pagination: PaginationMeta;
}

/**
 * Combined Paginated API Response
 * Usage: APIResponse<PaginatedData<FullProduct>>
 */
export type PaginatedAPIResponse<T> = APIResponse<PaginatedData<T>>;