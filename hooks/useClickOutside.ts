import { RefObject, useEffect } from "react"

/**
 * Custom React hook that triggers a callback when a mouse click occurs outside the specified element.
 *
 * @param ref - A React ref object pointing to the element to detect outside clicks for.
 * @param callback - A function to be called when a click outside the referenced element is detected.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => {
 *   // Handle click outside
 * });
 *
 * @remarks
 * This hook adds a 'mousedown' event listener to the document and cleans it up on unmount.
 */
export function useClickOutside(
	ref: RefObject<HTMLElement>,
	callback: () => void
) {
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (ref.current && !ref.current.contains(event.target as Node)) {
				callback()
			}
		}

		document.addEventListener("mousedown", handleClickOutside)
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [ref, callback])
}
