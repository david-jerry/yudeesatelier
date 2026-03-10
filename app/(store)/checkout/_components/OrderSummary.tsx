"use client"

import * as React from "react"
import Image from "next/image"
import { useCartStore } from "@/hooks/useZustand"
import { formatPrice } from "@/lib/formatters"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function OrderSummary() {
	const { items } = useCartStore()
	const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

	if (items.length === 0) {
		return (
			<p className="text-xs font-mono text-neutral-400">MANIFEST EMPTY</p>
		)
	}

	return (
		<div className="space-y-6">
			<ScrollArea className="h-75 pr-4">
				<ul className="space-y-6">
					{items.map((item) => (
						<li
							key={item.variantId}
							className="flex gap-4"
						>
							<div className="relative h-16 w-12 bg-neutral-100 overflow-hidden">
								{item.image && (
									<Image
										src={item.image}
										alt={item.name}
										fill
										className="object-cover grayscale hover:grayscale-0 transition-all"
									/>
								)}
							</div>
							<div className="flex-1 flex flex-col justify-between py-0.5">
								<div>
									<h4 className="text-[11px] uppercase font-bold tracking-tight leading-none">
										{item.name}
									</h4>
									<p className="text-[10px] text-neutral-400 mt-1 font-mono uppercase">
										Variant:{" "}
										{item.variantId.split("-").pop()} / Qty:{" "}
										{item.quantity}
									</p>
								</div>
								<span className="text-[11px] font-mono">
									{formatPrice({amount: (item.price * item.quantity), isKobo: false})}
								</span>
							</div>
						</li>
					))}
				</ul>
			</ScrollArea>

			<div className="pt-6 border-t border-neutral-200">
				<div className="flex justify-between items-end">
					<span className="text-[10px] font-mono uppercase text-neutral-500">
						Total Aggregate
					</span>
					<span className="text-xl font-serif italic">
						{formatPrice({amount: subtotal, isKobo: false})}
					</span>
				</div>
			</div>
		</div>
	)
}
