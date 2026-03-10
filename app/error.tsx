"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { RefreshCcw, Home, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	const router = useRouter()

	useEffect(() => {
		// Logging the error as per project standards
		console.error(error)
	}, [error])

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-background px-4 z-100">
			<Card className="w-full max-w-100 rounded-none border-border/40 bg-background/50 backdrop-blur-sm transition-all duration-1000 animate-in fade-in zoom-in-95">
				<CardHeader className="text-center pt-12">
					<div className="flex justify-center mb-6">
						<div className="rounded-full border border-border p-4">
							<Info className="h-6 w-6 text-muted-foreground stroke-1" />
						</div>
					</div>
					<CardTitle className="font-serif text-2xl uppercase tracking-[0.2em] font-light">
						System Interruption
					</CardTitle>
				</CardHeader>

				<CardContent className="text-center px-8 pb-8">
					<p className="text-[11px] uppercase tracking-widest text-muted-foreground leading-relaxed italic">
						An unexpected fragment has occurred within the archive.
						The requested experience is currently unavailable.
					</p>

					{error.digest && (
						<div className="mt-8 pt-4 border-t border-border/40">
							<p className="font-mono text-[9px] uppercase tracking-tighter opacity-30">
								Trace ID: {error.digest}
							</p>
						</div>
					)}
				</CardContent>

				<CardFooter className="flex flex-col gap-3 pb-12 px-8">
					<Button
						onClick={() => {
							reset()
							router.refresh()
						}}
						variant="default"
						className="w-full rounded-none h-12 uppercase tracking-[0.3em] text-[10px] transition-all duration-500"
					>
						<RefreshCcw className="mr-2 h-3 w-3 stroke-[1.5]" />
						Initialize Reset
					</Button>

					<Button
						asChild
						variant="outline"
						className="w-full rounded-none h-12 border-border/60 uppercase tracking-[0.3em] text-[10px] hover:bg-foreground hover:text-background transition-all duration-500"
					>
						<Link href="/">
							<Home className="mr-2 h-3 w-3 stroke-[1.5]" />
							Return to Entry
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	)
}
