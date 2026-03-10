/* eslint-disable react/no-unescaped-entities */
import { Separator } from "@/components/ui/separator"
import { Truck, Ruler, RefreshCcw, ShieldAlert } from "lucide-react"

export default function TermsPage() {
	return (
		<div className="max-w-4xl mx-auto py-20 px-6 space-y-16">
			{/* Header Section */}
			<section className="space-y-4">
				<div className="flex items-center gap-2">
					<div className="h-px w-12 bg-primary" />
					<span className="text-[10px] uppercase tracking-[0.5em] font-bold text-primary">
						Protocol 02
					</span>
				</div>
				<h1 className="text-4xl md:text-5xl font-serif uppercase italic tracking-tighter font-black">
					Service{" "}
					<span className="not-italic font-light">Manifesto</span>
				</h1>
				<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground max-w-xl leading-relaxed">
					Governing the acquisition, production, and distribution of
					bespoke silhouettes. Effective: March 2026.
				</p>
			</section>

			<Separator className="bg-border/40" />

			<div className="grid grid-cols-1 md:grid-cols-2 gap-y-16 gap-x-12">
				{/* Logistics & Patterns */}
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-foreground">
						<Truck
							size={18}
							strokeWidth={1.5}
						/>
						<h2 className="text-xs font-black uppercase tracking-widest">
							Logistics Synchronization
						</h2>
					</div>
					<p className="text-[11px] leading-relaxed text-muted-foreground uppercase tracking-wider">
						By finalizing an order, you grant consent for the use of
						your **Encrypted Logistics Data** for item distribution.
						We utilize a tiered delivery pattern:
						<br />
						<br />
						1. **Internal Transit**: Moving pieces from Atelier to
						the distribution node.
						<br />
						2. **Final Pulse**: Courier dispatch to your designated
						coordinate.
						<br />
						<br />
						Items are delivered only to the address synchronized
						during the checkout sequence.
					</p>
				</div>

				{/* The Tailoring Clause */}
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-foreground">
						<Ruler
							size={18}
							strokeWidth={1.5}
						/>
						<h2 className="text-xs font-black uppercase tracking-widest">
							Bespoke Production
						</h2>
					</div>
					<p className="text-[11px] leading-relaxed text-muted-foreground uppercase tracking-wider">
						Each garment is a unique iteration. Minor variations in
						texture, grain, and silhouette are inherent to the
						hand-finished nature of our Atelier. Production
						timelines are estimates and are subject to the
						complexity of the chosen pattern.
					</p>
				</div>

				{/* Refund Parameters */}
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-foreground">
						<RefreshCcw
							size={18}
							strokeWidth={1.5}
						/>
						<h2 className="text-xs font-black uppercase tracking-widest">
							Refund Parameters
						</h2>
					</div>
					<div className="space-y-3">
						<p className="text-[11px] leading-relaxed text-muted-foreground uppercase tracking-wider">
							Due to the specialized nature of tailored-to-order
							clothing:
						</p>
						<ul className="text-[10px] space-y-2 text-foreground/80 font-bold uppercase tracking-widest">
							<li className="flex gap-2">
								<span className="text-primary">—</span> Custom
								sizes are non-refundable.
							</li>
							<li className="flex gap-2">
								<span className="text-primary">—</span> Refunds
								are only initiated for structural defects.
							</li>
							<li className="flex gap-2">
								<span className="text-primary">—</span>{" "}
								Logistics fees are strictly non-recoverable.
							</li>
						</ul>
					</div>
				</div>

				{/* Liability Architecture */}
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-foreground">
						<ShieldAlert
							size={18}
							strokeWidth={1.5}
						/>
						<h2 className="text-xs font-black uppercase tracking-widest">
							Liability Architecture
						</h2>
					</div>
					<p className="text-[11px] leading-relaxed text-muted-foreground uppercase tracking-wider">
						The Atelier is not responsible for errors in
						user-provided measurements. Once a pattern is cut,
						modifications are prohibited. We reserve the right to
						terminate service for fraudulent synchronization
						attempts.
					</p>
				</div>
			</div>

			{/* Custom Refund Disclosure Block */}
			<div className="mt-20 p-8 border border-foreground/10 bg-muted/20 space-y-6">
				<h3 className="text-sm font-serif italic uppercase tracking-tighter font-black">
					Note on Tailored Goods
				</h3>
				<p className="text-[11px] text-muted-foreground uppercase tracking-widest leading-loose">
					Because your item is constructed specifically for your
					biometric data, it cannot be restocked or resold. We
					encourage all clients to double-verify their sizing profile
					before confirming the transaction pulse. In the event of a
					structural failure (torn seams prior to wear or incorrect
					material usage), a system credit or reconstruction will be
					offered.
				</p>
			</div>

			{/* Footer Sign-off */}
			<div className="flex flex-col items-center pt-10 border-t border-border/40">
				<p className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/60">
					Agreement valid for all transactions within the YUDEE'S
					system.
				</p>
			</div>
		</div>
	)
}
