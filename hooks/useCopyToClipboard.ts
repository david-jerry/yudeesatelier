import { config } from "@/config"
import { useState } from "react"

/**
 * Custom React hook to handle copying text to the clipboard and tracking copy status.
 *
 * @returns An object containing:
 * - `isCopied`: A boolean indicating if the text was successfully copied.
 * - `copy`: An async function that copies the provided text to the clipboard and updates `isCopied`.
 *
 * @example
 * const { isCopied, copy } = useClipboard();
 * <button onClick={() => copy('Hello!')}>{isCopied ? 'Copied!' : 'Copy'}</button>
 */
export function useClipboard() {
	const [isCopied, setIsCopied] = useState(false)

	const copy = async (text: string) => {
		const success = await copyToClipboard({ text })
		setIsCopied(success)

		// Reset after 2 seconds
		if (success) {
			setTimeout(() => setIsCopied(false), 2000)
		}

		return success
	}

	return { isCopied, copy }
}

async function copyToClipboard({ text }: { text: string }): Promise<boolean> {
	try {
		// Modern clipboard API (most browsers)
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(text)
			return true
		}

		// Fallback for older browsers
		const textarea = document.createElement("textarea")
		textarea.value = text
		textarea.style.position = "fixed" // Prevent scrolling to bottom
		document.body.appendChild(textarea)
		textarea.select()

		const success = document.execCommand("copy")
		document.body.removeChild(textarea)

		return success
	} catch (error) {
		if (config.NODE_ENV !== "production")
			console.error("Copy failed:", error)
		return false
	}
}
