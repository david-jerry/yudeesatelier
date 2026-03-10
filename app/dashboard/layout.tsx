import React from "react"
import type { Metadata } from "next"
import DashboardHeader from "./_components/Header"
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { createMetadata } from "@/lib/metadata"

export const metadata: Metadata = createMetadata({
	title: "Dashboard - Yudees Atelier",
	description:
		"Your personal dashboard to manage your wishlist, orders, and account settings on Yudees Atelier.",
	icons: {
		icon: "/favicon.ico",
	},
})

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<SidebarProvider>
			<AppSidebar />
			{/* 1. Set the inset to fill the screen and hide its own overflow */}
			<SidebarInset className="flex flex-col h-screen overflow-hidden">
				{/* The Header stays at the top because it's a flex child */}
				<DashboardHeader />

				{/* 2. main takes remaining space and handles its own scrolling */}
				<main className="flex-1 overflow-y-auto p-4 gap-4 flex flex-col">
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
