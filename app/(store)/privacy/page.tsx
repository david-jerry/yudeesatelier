import React from 'react'
import { Separator } from "@/components/ui/separator"
import { ShieldCheck, Lock, CreditCard, Trash2 } from "lucide-react"

export default function PrivacyPage() {
  return (
		<div className="max-w-4xl mx-auto py-20 px-6 space-y-16">
			{/* Header Section */}
			<section className="space-y-4">
				<div className="flex items-center gap-2">
					<div className="h-px w-12 bg-primary" />
					<span className="text-[10px] uppercase tracking-[0.5em] font-bold text-primary">
						Protocol 01
					</span>
				</div>
				<h1 className="text-4xl md:text-5xl font-serif uppercase italic tracking-tighter font-black">
					Privacy{" "}
					<span className="not-italic font-light">Architecture</span>
				</h1>
				<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground max-w-xl leading-relaxed">
					This document outlines the data synchronization and
					protection protocols for YUDEE'S Atelier. Last Updated:
					March 2026.
				</p>
			</section>

			<Separator className="bg-border/40" />

			{/* Data Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-12">
				{/* Identity & Encryption */}
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-foreground">
						<ShieldCheck
							size={18}
							strokeWidth={1.5}
						/>
						<h2 className="text-xs font-black uppercase tracking-widest">
							Identity & Encryption
						</h2>
					</div>
					<p className="text-[11px] leading-relaxed text-muted-foreground uppercase tracking-wider">
						We retain only essential identifiers: your **Legal
						Name** and **Email Address**. To ensure total
						communication security, your email record is stored
						behind a unique **Secure Encryption Key**. This prevents
						unauthorized entities from accessing your contact data
						or utilizing it for unsolicited outreach.
					</p>
				</div>

				{/* Financial Protocol */}
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-foreground">
						<CreditCard
							size={18}
							strokeWidth={1.5}
						/>
						<h2 className="text-xs font-black uppercase tracking-widest">
							Financial Protocol
						</h2>
					</div>
					<p className="text-[11px] leading-relaxed text-muted-foreground uppercase tracking-wider">
						Transaction processing is handled exclusively by
						**Paystack**. YUDEE'S Atelier **never stores** credit
						card numbers, CVVs, or sensitive financial tokens on our
						local servers. All payment logic is executed within
						Paystack's PCI-compliant environment.
					</p>
				</div>

				{/* Logistics Obfuscation */}
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-foreground">
						<Lock
							size={18}
							strokeWidth={1.5}
						/>
						<h2 className="text-xs font-black uppercase tracking-widest">
							Logistics Obfuscation
						</h2>
					</div>
					<p className="text-[11px] leading-relaxed text-muted-foreground uppercase tracking-wider">
						Shipping addresses are subject to our **Malformed
						Encryption Strategy**. Stored data is scrambled and
						encrypted, making it unreadable to anyone outside of the
						delivery synchronization flow. This ensures your
						physical location remains a private node within our
						system.
					</p>
				</div>

				{/* Data Sovereignty */}
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-foreground">
						<Trash2
							size={18}
							strokeWidth={1.5}
						/>
						<h2 className="text-xs font-black uppercase tracking-widest">
							Data Sovereignty
						</h2>
					</div>
					<p className="text-[11px] leading-relaxed text-muted-foreground uppercase tracking-wider">
						We believe in complete user agency. You retain the right
						to **Purge Your Record** at any time. Through your
						account settings, you may initiate an immediate wipe of
						all personal data, clearing your history from our system
						permanently.
					</p>
				</div>
			</div>

			<Separator className="bg-border/40" />

			{/* Footer Note */}
			<footer className="pt-10">
				<div className="bg-muted/30 p-8 border border-border/50">
					<p className="text-[10px] font-serif italic text-muted-foreground leading-relaxed text-center">
						"In an era of digital excess, we choose the path of
						minimal retention and maximum protection."
						<br />
						<span className="mt-4 block not-italic uppercase tracking-[0.3em] font-bold text-foreground">
							YUDEE'S Atelier — Technical Safety Division
						</span>
					</p>
				</div>
			</footer>
		</div>
  )
}
