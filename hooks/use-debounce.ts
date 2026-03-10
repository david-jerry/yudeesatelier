import { useEffect, useState } from "react";

/**
 * Standard debounce hook to delay state updates.
 * Useful for search inputs and filter changes in the Admin Dashboard.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set a timer to update the debounced value after the specified delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timer if the value changes before the delay is reached
        // This is what prevents the API from being hammered
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}