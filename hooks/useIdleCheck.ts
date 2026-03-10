import { useEffect, useRef, useCallback } from "react"

type UseIdleCheckOptions = {
    timeout: number
	alertTimeout: number
	onIdle?: () => void
	onTimeout?: () => void
	onActive?: () => void
	events?: string[]
}

const DEFAULT_EVENTS = [
    "mousemove",
	"mousedown",
	"keydown",
	"touchstart",
	"scroll",
]

/**
 * React hook to detect user inactivity (idle state) and trigger callbacks or actions after a specified timeout.
 * Optionally, it can show an alert or perform an action before timing out, and can attempt to close the current tab.
 *
 * @param options - Configuration options for idle checking.
 * @param options.timeout - Time in milliseconds before considering the user idle.
 * @param options.alertTimeout - Time in milliseconds after idle before triggering the timeout action.
 * @param options.onIdle - Optional callback invoked when the user becomes idle.
 * @param options.onTimeout - Optional callback invoked when the timeout is reached after idle.
 * @param options.onActive - Optional callback invoked when the user becomes active again after being idle.
 * @param options.events - Optional array of DOM event names to listen for user activity. Defaults to common interaction events.
 * @returns An object with a `reset` function to manually reset the idle timer.
 *
 * @example
 * ```tsx
 * import { useIdleCheck } from './hooks/useIdleCheck';
 *
 * function App() {
 *   useIdleCheck({
 *     timeout: 5 * 60 * 1000, // 5 minutes
 *     alertTimeout: 30 * 1000, // 30 seconds after idle
 *     onIdle: () => {
 *       alert('You have been idle!');
 *     },
 *     onTimeout: () => {
 *       alert('Session timed out. Closing tab...');
 *     },
 *     onActive: () => {
 *       console.log('User is active again.');
 *     },
 *   });
 *
 *   return <div>Welcome to the app!</div>;
 * }
 * ```
 */
export function useIdleCheck({
	timeout,
	alertTimeout,
	onIdle,
	onTimeout,
	onActive,
	events = DEFAULT_EVENTS,
}: UseIdleCheckOptions) {
	const idleTimer = useRef<NodeJS.Timeout | null>(null)
	const alertTimer = useRef<NodeJS.Timeout | null>(null)
	const idle = useRef(false)
	const alertShown = useRef(false)

	const clearTimers = () => {
		if (idleTimer.current) {
			clearTimeout(idleTimer.current)
			idleTimer.current = null
		}
		if (alertTimer.current) {
			clearTimeout(alertTimer.current)
			alertTimer.current = null
		}
	}

	const closeCurrentTab = () => {
		// Try to close the window (works for windows opened by JavaScript)
		try {
			window.close()
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (e) {
			// If that fails, try to redirect to about:blank
			try {
				window.location.href = "about:blank"
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (e) {
				// As a last resort, replace the current page with a blank one
				document.open()
				document.close()
			}
		}
	}

	const handleTimeout = useCallback(() => {
		if (onTimeout) onTimeout()
		closeCurrentTab()
	}, [onTimeout])

	const handleIdle = useCallback(() => {
		idle.current = true
		alertShown.current = true
		if (onIdle) onIdle()
		alertTimer.current = setTimeout(handleTimeout, alertTimeout)
	}, [onIdle, alertTimeout, handleTimeout])

	const reset = useCallback(() => {
		if (idle.current && onActive) {
			onActive()
		}
		idle.current = false
		if (alertShown.current) {
			alertShown.current = false
			if (alertTimer.current) {
				clearTimeout(alertTimer.current)
				alertTimer.current = null
			}
		}
		if (idleTimer.current) {
			clearTimeout(idleTimer.current)
		}
		idleTimer.current = setTimeout(handleIdle, timeout)
	}, [timeout, handleIdle, onActive])

	useEffect(() => {
		for (const event of events) {
			window.addEventListener(event, reset, true)
		}
		idleTimer.current = setTimeout(handleIdle, timeout)

		return () => {
			clearTimers()
			for (const event of events) {
				window.removeEventListener(event, reset, true)
			}
		}
	}, [events, timeout, reset, handleIdle])

	return { reset }
}
