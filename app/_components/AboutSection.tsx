"use client"

import { config } from "@/config"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export function AboutSection() {
	const router = useRouter()
	

	return (
		<section className="py-24 md:py-40 px-6 border-y border-border bg-background transition-colors duration-500">
			<div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 lg:gap-32 items-center">
				{/* Visual Narrative */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.8 }}
					className="aspect-4/5 bg-muted relative overflow-hidden group border border-border/50"
				>
					<Image
						src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920"
						alt={`${config.TITLE} Studio`}
						fill
						className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 ease-in-out scale-105 group-hover:scale-100"
						sizes="(max-width: 768px) 100vw, 50vw"
					/>
					<div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-1000" />
				</motion.div>

				{/* Text Content */}
				<div className="flex flex-col items-start">
					<motion.div
						initial={{ opacity: 0, x: 10 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="space-y-10"
					>
						<div className="space-y-4">
							<span className="text-[10px] uppercase tracking-[0.6em] text-primary font-bold">
								01 / The Atelier
							</span>
							<h2 className="text-5xl md:text-7xl font-serif text-foreground leading-[1.1] tracking-tighter">
								Architecture for <br />
								<span className="italic font-light">
									the Silhouette.
								</span>
							</h2>
						</div>

						<div className="space-y-6 max-w-lg">
							<p className="text-muted-foreground text-lg md:text-xl leading-relaxed font-light">
								{config.TITLE} defines the intersection of
								rigorous tailoring and ethereal comfort. Founded
								in 2024, our mission remains unchanged: to
								curate a wardrobe that transcends seasons.
							</p>
							<p className="text-muted-foreground/70 text-sm uppercase tracking-widest leading-loose">
								Every piece is an investment in self-expression,
								crafted from the world&apos;s finest sustainable
								textiles.
							</p>
						</div>

						<div className="pt-8 w-full md:w-auto">
							<Button
								onClick={() => router.push("/archive")}
								className="group relative w-full md:w-auto h-16 px-10 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-all duration-300"
							>
								<span className="text-[10px] uppercase tracking-[0.4em] font-black mr-4">
									Browse Archive
								</span>
								<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-2" />
							</Button>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	)
}
