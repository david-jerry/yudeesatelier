"use client"

import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
	Check,
	X,
	ArrowRight,
	Package,
	Loader2,
	AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// shadcn components
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { useCartStore } from "@/hooks/useZustand"
import { verifyPayment } from "@/actions/paystack"
import { updateOrderAfterPayment } from "@/actions/orders"

export default function ConfirmPage() {
	const searchParams = useSearchParams()
	const { clearCart } = useCartStore()

	const [status, setStatus] = useState<
		"verifying" | "success" | "error" | "sync_issue"
	>("verifying")
	const [isProcessing, setIsProcessing] = useState(true)
	const hasRun = useRef(false)

	const reference = searchParams.get("reference")
	const orderId = searchParams.get("orderId")

	useEffect(() => {
		if (!reference || !orderId || hasRun.current) return

		const performVerification = async () => {
			hasRun.current = true
			try {
				const verification = await verifyPayment(reference)

				if (
					verification.status &&
					verification.data.status === "success"
				) {
					const updateRes = await updateOrderAfterPayment({
						orderId,
						reference,
						paidAmount: verification.data.amount / 100,
						paidAt: new Date(
							verification.data.paid_at || Date.now(),
						),
					})

					if (updateRes.success) {
						clearCart()
						setStatus("success")
					} else {
						setStatus("sync_issue")
					}
				} else {
					setStatus("error")
				}
			} catch (err) {
				console.error("Verification sequence failed", err)
				setStatus("error")
			} finally {
				setIsProcessing(false)
			}
		}

		performVerification()
	}, [reference, orderId, clearCart])

	if (!reference || !orderId) {
		return (
			<div className="container min-h-[60vh] flex flex-col items-center justify-center text-center font-mono uppercase tracking-tighter">
				<div className="space-y-6 max-w-md">
					<h2 className="text-destructive text-2xl font-bold italic underline decoration-1 underline-offset-8">
						Invalid Session // 403
					</h2>
					<p className="opacity-60 text-xs leading-relaxed">
						The requested sequence parameters are missing or
						corrupted. The system has halted processing to prevent
						data mismatch.
					</p>
					<Button
						asChild
						variant="outline"
						className="rounded-none border-black hover:bg-black hover:text-white transition-all uppercase px-12 py-6 text-[10px] tracking-[0.3em]"
					>
						<Link href="/shop">Return to Archive</Link>
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="container max-w-5xl px-6 py-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
			<div className="space-y-20">
				{/* Status Header: The Atelier "Technical" Bar */}
				<div className="space-y-10">
					<div className="flex items-center gap-6">
						<div className="flex flex-col">
							<span className="text-[9px] font-mono text-neutral-400 uppercase tracking-[0.4em] mb-1">
								Log Sequence
							</span>
							<span className="text-[10px] font-mono border border-black px-3 py-1 uppercase tracking-widest bg-black text-white inline-block">
								{isProcessing
									? "00 // Verifying"
									: `03 // ${status.replace("_", " ")}`}
							</span>
						</div>
						<Separator className="flex-1 bg-neutral-200" />
					</div>

					<div className="text-center space-y-8">
						<div
							className={cn(
								"inline-flex items-center justify-center w-20 h-20 rounded-full border transition-all duration-700 ease-in-out",
								isProcessing
									? "border-dashed border-neutral-300 animate-pulse"
									: status === "success"
										? "border-black scale-110"
										: "border-destructive text-destructive",
							)}
						>
							{isProcessing ? (
								<Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
							) : status === "success" ? (
								<Check className="w-10 h-10 stroke-[1.5px]" />
							) : (
								<X className="w-10 h-10 stroke-[1.5px]" />
							)}
						</div>

						<div className="space-y-4">
							<h1 className="text-6xl md:text-8xl font-light tracking-[ -0.05em] uppercase leading-none text-neutral-900">
								{isProcessing
									? "Validating"
									: status === "success"
										? "Confirmed"
										: "Halted"}
							</h1>
							<p className="font-serif italic text-neutral-500 text-xl max-w-xl mx-auto leading-relaxed">
								{isProcessing
									? "Liaising with the financial gateway to authorize your acquisition. This usually resolves in seconds."
									: status === "success"
										? "The transaction is complete. Your order has been registered in our ledgers and is awaiting logistical fulfillment."
										: "The verification sequence was rejected by the provider. No funds have been captured for this session."}
							</p>
						</div>
					</div>
				</div>

				{/* Technical Specification Grid: The "Architectural" Look */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-200 border-y border-neutral-200">
					<div className="bg-background py-12 pr-8 space-y-3">
						<span className="uppercase text-[10px] tracking-[0.4em] font-bold text-neutral-400 block">
							Identifier // Order
						</span>
						<p className="font-mono text-base uppercase font-medium tracking-tighter">
							{orderId}
						</p>
					</div>
					<div className="bg-background py-12 md:pl-8 md:text-right space-y-3 border-t md:border-t-0 border-neutral-200">
						<span className="uppercase text-[10px] tracking-[0.4em] font-bold text-neutral-400 block">
							Audit // Reference
						</span>
						<p className="font-mono text-base uppercase truncate font-medium tracking-tighter text-neutral-600 italic">
							{reference}
						</p>
					</div>
				</div>

				{/* Navigation: Industrial Buttons */}
				<div className="flex flex-col md:flex-row gap-4">
					<Button
						asChild
						disabled={isProcessing}
						className={cn(
							"flex-1 h-20 rounded-none uppercase font-mono text-[11px] tracking-[0.5em] transition-all duration-300",
							isProcessing
								? "bg-neutral-100 text-neutral-400"
								: "bg-black text-white hover:bg-neutral-800",
						)}
					>
						<Link
							href="/dashboard/orders"
							className="flex items-center justify-between w-full px-10"
						>
							<span>
								{isProcessing
									? "Awaiting Data"
									: "Trace Shipment"}
							</span>
							<Package className="h-4 w-4" />
						</Link>
					</Button>

					<Button
						asChild
						variant="outline"
						className="flex-1 h-20 rounded-none border-neutral-200 hover:border-black hover:bg-transparent transition-all duration-300 uppercase font-mono text-[11px] tracking-[0.5em]"
					>
						<Link
							href="/shop"
							className="flex items-center justify-between w-full px-10 text-neutral-600 hover:text-black"
						>
							<span>Continue Gallery</span>
							<ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
				</div>

				{/* Exception Handling: The Atelier Warning */}
				{status === "sync_issue" && (
					<Alert className="rounded-none border-amber-500 bg-amber-50/50 p-8">
						<AlertCircle className="h-5 w-5 text-amber-600" />
						<AlertTitle className="font-mono text-[11px] uppercase tracking-widest font-bold text-amber-900 mb-2 italic">
							Database Synchronisation Failure
						</AlertTitle>
						<AlertDescription className="font-mono text-[10px] uppercase leading-relaxed text-amber-800 tracking-wider">
							Payment was verified, but the internal system failed
							to update. Manual intervention required. Please
							preserve audit reference: {reference}
						</AlertDescription>
					</Alert>
				)}
			</div>
		</div>
	)
}
