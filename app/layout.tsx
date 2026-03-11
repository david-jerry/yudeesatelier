import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import TanstackProviders from "@/providers/QueryProvider"
import { createMetadata } from "@/lib/metadata"
import LocalToaster from "@/components/common/LocalToaster"
import { AuthProvider } from "@/providers/AuthProvider"

import "./globals.css"
import { ModeToggle } from "@/components/common/Mode"
import { getSafeSession } from "@/actions/auth"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

export const metadata: Metadata = createMetadata({
	title: "Yudees Atelier",
	description:
		"Discover, track, and manage your favorite products with Yudees Atelier - your personal wishlist and order management hub.",
	icons: {
		icon: "/favicon.ico",
	},
})

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const session = await getSafeSession()

	const fixedUser = session?.user
		? {
				...session.user,
				image: session.user.image ?? null,
				imagePublicId: session.user.imagePublicId ?? null,
				isAdmin: session.user.isAdmin ?? false,
				isStaff: session.user.isStaff ?? false,
				subscribed: session.user.subscribed ?? null,
			}
		: null

	console.info(
		"[RootLayout] Retrieved session and user data for initial auth sync",
		{
			sessionExists: !!session,
			userExists: !!fixedUser,
			userId: fixedUser?.id ?? "N/A",
		},
	)

	return (
		<html
			lang="en"
			className={inter.variable}
		>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AuthProvider initialUser={fixedUser}>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange={false}
					>
						<TanstackProviders>
							<TooltipProvider>
								{children}
								<LocalToaster />
								<ModeToggle />
							</TooltipProvider>
						</TanstackProviders>
					</ThemeProvider>
				</AuthProvider>
			</body>
		</html>
	)
}
