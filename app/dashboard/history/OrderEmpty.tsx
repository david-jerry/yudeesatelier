import { History, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function OrderEmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-32 border border-dashed border-neutral-200 bg-neutral-50/30">
			<div className="relative mb-6">
				<History className="h-12 w-12 text-neutral-200 stroke-[1px]" />
				<div className="absolute -bottom-1 -right-1 bg-white p-1 border border-neutral-200">
					<ShoppingBag className="h-3 w-3 text-neutral-400" />
				</div>
			</div>
			<div className="text-center space-y-2 mb-8">
				<h3 className="font-mono text-xs uppercase tracking-[0.4em] text-neutral-900">
					Zero_Records_Found
				</h3>
				<p className="font-serif italic text-neutral-500 text-sm max-w-70">
					Your transaction history is currently a blank canvas. Start
					your collection today.
				</p>
			</div>
			<Button
				asChild
				variant="outline"
				className="rounded-none border-neutral-900 font-mono text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all"
			>
				<Link href="/shop">Initialize Acquisition</Link>
			</Button>
		</div>
	)
}
