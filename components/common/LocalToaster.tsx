"use client"

import { useTheme } from "next-themes"
import { Toaster } from "sonner"

export default function LocalToaster() {
	const { theme, resolvedTheme } = useTheme()
	const currentTheme = resolvedTheme || theme

	return (
		<>
			<Toaster
				closeButton={false}
				richColors={false}
				className="bg-background text-foreground"
				theme={currentTheme === "dark" ? "dark" : "light"}
				duration={10000}
				expand={true}
				position="bottom-center"
			/>
		</>
	)
}
