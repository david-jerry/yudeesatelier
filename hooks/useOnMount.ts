import { useEffect } from "react"

/**
 * React hook that runs a callback function once when the component mounts.
 *
 * The callback will only be executed on the client side (browser), not during server-side rendering.
 *
 * @param callback - The function to execute when the component mounts.
 *
 * @example
 * useOnMount(() => {
 *   console.log('Component has mounted!');
 * });
 */
export function useOnMount(callback: () => void): void {
	useEffect(() => {
		if (typeof window !== "undefined") {
			callback()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
}
