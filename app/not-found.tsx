/* eslint-disable react/no-unescaped-entities */
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Logo from "@/components/common/Logo"
import { ChevronLeft, Home, ShieldAlert, Terminal } from "lucide-react"

export default function NotFound() {
	const router = useRouter()

	return (
		<main className="relative min-h-screen flex flex-col items-center justify-center bg-background p-6 overflow-hidden">
			{/* Background Decorative "Watermark" */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
				<span className="text-[25vw] font-black text-primary/[0.03] tracking-tighter italic font-serif">
					404
				</span>
			</div>

			<div className="w-full max-w-[420px] z-10 space-y-12">
				<div className="flex flex-col items-center gap-6 text-center">
					<Link
						href="/"
						className="transition-opacity hover:opacity-80"
					>
						<Logo />
					</Link>

					<div className="space-y-2">
						<div className="flex items-center justify-center gap-2">
							<span className="h-px w-8 bg-destructive/30" />
							<span className="text-[10px] uppercase tracking-[0.4em] font-bold text-destructive">
								Critical Error
							</span>
							<span className="h-px w-8 bg-destructive/30" />
						</div>
						<h1 className="text-3xl font-serif uppercase italic font-black tracking-tighter text-foreground">
							Archive{" "}
							<span className="not-italic font-light">
								Missing
							</span>
						</h1>
					</div>

					<div className="min-h-24 flex flex-col items-center justify-center gap-4">
						<ShieldAlert
							className="h-10 w-10 text-destructive/80"
							strokeWidth={1}
						/>
						<div className="space-y-1">
							<p className="text-[11px] uppercase tracking-[0.2em] font-bold text-foreground">
								Resource Not Found
							</p>
							<p className="text-[10px] uppercase tracking-widest text-muted-foreground max-w-[280px] leading-relaxed">
								The requested coordinate does not exist in the
								Atelier central index.
							</p>
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<Button
							variant="outline"
							onClick={() => router.back()}
							className="h-12 rounded-none uppercase text-[10px] tracking-[0.2em] font-bold border-muted-foreground/20 hover:bg-secondary transition-all"
						>
							<ChevronLeft className="mr-2 h-3 w-3" />
							Step Back
						</Button>

						<Button
							asChild
							className="h-12 rounded-none uppercase text-[10px] tracking-[0.2em] font-bold"
						>
							<Link href="/">
								<Home className="mr-2 h-3 w-3" />
								Home Base
							</Link>
						</Button>
					</div>

					<Separator className="bg-border/40" />

					<div className="flex items-center justify-between px-1">
						<div className="flex items-center gap-2 text-muted-foreground/40">
							<Terminal className="h-3 w-3" />
							<span className="text-[9px] uppercase tracking-widest font-medium">
								Error Code: 0x404_NULL
							</span>
						</div>
						<Link
							href="/support"
							className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/60 hover:text-primary transition-colors underline underline-offset-4"
						>
							Report Leak
						</Link>
					</div>
				</div>

				<p className="text-[9px] text-center uppercase tracking-[0.3em] text-muted-foreground/30 font-medium pt-8">
					Atelier System v3.0.1 • Navigation Failure
				</p>
			</div>
		</main>
	)
}
