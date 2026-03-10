"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen } from "lucide-react"
import { formatPrice } from "@/lib/formatters"
import { useStorefront } from "@/hooks/useStorefront"
import { FullProduct } from "@/db/models/product"

// --- Hero Component: Featuring Featured Products ---
const AboutHero = () => {
	const {
		data,
		isLoading,
		isError,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useStorefront()

	// 1. Extract static context from the first segment
	// We use optional chaining and provide fallbacks to prevent "undefined" crashes
	const tags = data?.pages[0]?.tags || []
	const featuredProducts = data?.pages[0]?.featured || []
	
	return (
		<section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-background">
			{/* Background Parallax/Visuals of Featured Products */}
			<div className="absolute inset-0 z-0 grid grid-cols-2 md:grid-cols-4 gap-2 opacity-30 grayscale hover:grayscale-0 transition-all duration-1000">
				{!isLoading &&
					featuredProducts?.slice(0, 4).map((product, i) => (
						<div
							key={product.id}
							className="relative h-full w-full"
						>
							<Image
								src={
									product.images[0]?.url ||
									"https://placehold.co/400"
								}
								alt={product.name}
								fill
								className="object-cover"
							/>
						</div>
					))}
			</div>

			<div className="absolute inset-0 bg-linear-to-b from-background via-transparent to-background z-1" />

			<div className="container px-6 text-center z-10 mx-auto">
				<motion.span
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-[10px] uppercase tracking-[0.6em] text-primary mb-6 block font-bold"
				>
					The Archive Since 2024
				</motion.span>
				<motion.h1
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="text-6xl md:text-8xl font-serif tracking-tighter mb-8 leading-[0.9]"
				>
					Curating <br />{" "}
					<span className="italic font-light text-muted-foreground">
						The Eternal
					</span>
				</motion.h1>
			</div>
		</section>
	)
}

// --- Latest Arrivals Section ---
const LatestArrivals = () => {
		const {
			data,
			isLoading,
			isError,
			fetchNextPage,
			hasNextPage,
			isFetchingNextPage,
		} = useStorefront()
	
		// 1. Extract static context from the first segment
		// We use optional chaining and provide fallbacks to prevent "undefined" crashes
		const tags = data?.pages[0]?.tags || []
		const latestProducts = useMemo(() => {
			const products: FullProduct[] = Array.isArray(data?.pages[0]?.products)
				? data.pages[0].products
				: []

			return [...products]
				.sort((a, b) => {
					return (
						new Date(b.createdAt).getTime() -
						new Date(a.createdAt).getTime()
					)
				})
				.slice(0, 4) // Get the top 4 latest pieces
		}, [data])

	return (
		<section className="py-32 bg-background">
			<div className="container px-6 mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
					<div className="space-y-2">
						<span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
							New Release
						</span>
						<h2 className="text-4xl font-serif uppercase tracking-tight">
							Latest Study
						</h2>
					</div>
					<Link href="/shop">
						<Button
							variant="link"
							className="p-0 h-auto uppercase text-[10px] tracking-widest gap-2"
						>
							View All <ArrowRight size={12} />
						</Button>
					</Link>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
					{latestProducts?.slice(0, 4).map((product) => (
						<motion.div
							key={product.id}
							whileHover={{ y: -5 }}
							className="group cursor-pointer"
						>
							<div className="aspect-3/4 relative bg-muted mb-4 overflow-hidden">
								<Image
									src={product.images[0]?.url || "https://placehold.co/400"}
									alt={product.name}
									fill
									className="object-cover transition-transform duration-700 group-hover:scale-105"
								/>
							</div>
							<h3 className="text-[11px] uppercase tracking-widest mb-1">
								{product.name}
							</h3>
							<p className="text-[10px] text-muted-foreground font-serif italic">
								{formatPrice({
									amount: product.basePrice,
									currency: "NGN",
									isKobo: false,
								})}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	)
}

// --- Narrative & Values (Restyled for spacing) ---
const TheNarrative = () => (
	<section className="py-32 container px-6 mx-auto border-t border-border/50">
		<div className="grid md:grid-cols-12 gap-16 items-start">
			<div className="md:col-span-5 space-y-8">
				<h2 className="text-[10px] font-black tracking-[0.5em] uppercase text-primary">
					Our Philosophy
				</h2>
				<p className="text-muted-foreground leading-relaxed text-2xl font-serif italic">
					"Every piece is a dialogue between the fabric and the
					wearer, designed to transcend seasons."
				</p>
				<div className="h-px w-20 bg-primary/30" />
				<p className="text-muted-foreground leading-relaxed font-light text-lg">
					Based in the heart of the city, our studio serves as a
					sanctuary for creativity, where we prioritize intentionality
					over impulse.
				</p>
			</div>
			<div className="md:col-span-7 aspect-16/10 bg-muted relative group overflow-hidden border border-border">
				<div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070')] bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-1000" />
			</div>
		</div>
	</section>
)

// --- Style Guides CTA ---
const StyleGuidesCTA = () => (
	<section className="py-24 bg-muted/30 border-y border-border">
		<div className="container px-6 mx-auto flex flex-col items-center text-center">
			<BookOpen
				className="mb-6 text-primary/60"
				size={32}
				strokeWidth={1}
			/>
			<h2 className="text-3xl md:text-5xl font-serif mb-6 tracking-tight">
				The Art of <span className="italic">Dressing</span>
			</h2>
			<p className="max-w-xl text-muted-foreground mb-10 font-light leading-loose uppercase text-[11px] tracking-widest">
				Discover our curated style guides. We write about construction,
				textile care, and the architecture of the modern wardrobe.
			</p>
			<Link href="/archive">
				<Button className="rounded-none px-10 h-14 uppercase tracking-[0.3em] text-[10px] font-black transition-all hover:gap-4">
					Read Style Guides{" "}
					<ArrowRight
						size={14}
						className="ml-2"
					/>
				</Button>
			</Link>
		</div>
	</section>
)

// --- Main Page ---
export default function AboutComponent() {
	return (
		<main className="bg-background text-foreground selection:bg-primary/10">
			<AboutHero />
			<LatestArrivals />
			<TheNarrative />
			<StyleGuidesCTA />

			<section className="py-40 text-center container px-6 mx-auto">
				<h2 className="text-[10px] font-black tracking-[0.6em] uppercase mb-12">
					Enter the Atelier
				</h2>
				<Link href="/shop">
					<Button
						variant="outline"
						className="rounded-none px-16 py-8 uppercase tracking-[0.4em] text-[10px] border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-500"
					>
						Explore Collection
					</Button>
				</Link>
			</section>
		</main>
	)
}
