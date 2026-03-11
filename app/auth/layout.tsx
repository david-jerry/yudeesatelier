import type { Metadata } from "next"
import { BackButton } from "@/app/auth/_component/BackButton"
import { createMetadata } from "@/lib/metadata"

export const metadata: Metadata = createMetadata({
    title: "Authentication - Yudee's Atelier",
    description: "Access your Yudee's Atelier account. Manage your orders, shipping, and more with ease.",
})

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative">
			<BackButton />
			<div className="w-full max-w-sm">{children}</div>
		</main>
	)
}
