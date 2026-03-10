import { useEffect, useRef, useState } from 'react';

/**
 * A custom React hook that ensures a callback runs only once on the client side,
 * after hydration. Useful for client-only effects that should not run during SSR.
 *
 * @param callback - The function to execute once after the component mounts on the client.
 * @returns A boolean indicating whether the callback has run.
 *
 * @example
 * ```tsx
 * import { useClientOnce } from './hooks/useClientOnce';
 *
 * function MyComponent() {
 *   const hasRun = useClientOnce(() => {
 *     console.log('This runs only once on the client after hydration.');
 *   });
 *
 *   return <div>Effect has run: {hasRun ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export function useClientOnce(callback: () => void) {
    const hasRun = useRef(false);
    const [ran, setRan] = useState(false);

    useEffect(() => {
        if (!hasRun.current) {
            hasRun.current = true;
            callback();
            setRan(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return ran;
}