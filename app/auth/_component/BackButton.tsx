"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface BackButtonProps {
	className?: string
}

export function BackButton({ className }: BackButtonProps) {
	const router = useRouter()

	return (
		<Button
			size="icon"
			onClick={() => router.back()}
			className={`fixed left-6 top-6 z-50 h-10 w-10 rounded-full ${className}`}
		>
			<ChevronLeft className="h-7 w-7" />
			<span className="sr-only">Go back</span>
		</Button>
	)
}
