"use client"

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import Image from "next/image"
import { config } from "@/config"
import { FullProduct } from "@/db/models/product"
import QuillRenderer from "@/components/common/QuillRenderer" // Imported your component

export function Hero({ products }: { products: FullProduct[] }) {
	const containerRef = useRef(null)
	const [index, setIndex] = useState(0)
	const { scrollY } = useScroll()

	const y = useTransform(scrollY, [0, 500], [0, 200])
	const opacity = useTransform(scrollY, [0, 300], [1, 0])

	useEffect(() => {
		if (products.length <= 1) return
		const timer = setInterval(() => {
			setIndex((prev) => (prev + 1) % products.length)
		}, 6000)
		return () => clearInterval(timer)
	}, [products.length])

	const scrollToShop = () => {
		const shopSection = document.getElementById("shop")
		shopSection?.scrollIntoView({ behavior: "smooth" })
	}

	const currentProduct = products[index]
	const backgroundImage =
		currentProduct?.images?.[0]?.url ||
		"https://images.unsplash.com/photo-1445205170230-053b830c6039?q=80&w=2070"

	return (
		<section
			ref={containerRef}
			className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-background"
		>
			<motion.div
				style={{ y, opacity }}
				className="absolute inset-0 z-0"
			>
				<div className="absolute inset-0 bg-linear-to-b from-background/40 via-transparent to-background z-10" />
				<AnimatePresence mode="wait">
					<motion.div
						key={index}
						initial={{ opacity: 0, scale: 1.1 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 2, ease: "easeInOut" }}
						className="absolute inset-0"
					>
						<Image
							src={backgroundImage}
							alt={currentProduct?.name || config.TITLE}
							fill
							className="object-cover grayscale-[0.3] brightness-[0.6] dark:brightness-[0.4]"
							priority
						/>
					</motion.div>
				</AnimatePresence>
			</motion.div>

			<div className="relative z-20 flex flex-col items-center text-center px-6 w-full">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
				>
					<span className="text-[10px] md:text-xs uppercase tracking-[0.6em] text-muted-foreground mb-4 block font-medium">
						Featured Selection • {index + 1} /{" "}
						{products.length || 1}
					</span>
					<h1 className="text-6xl md:text-[10rem] font-serif text-foreground leading-none tracking-tighter mb-8 uppercase">
						{config.TITLE || "Atelier"}
					</h1>
				</motion.div>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.8, duration: 1 }}
					className="flex flex-col items-center gap-8 w-full"
				>
					<AnimatePresence mode="wait">
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="max-w-2xl"
						>
							{/* Using the QuillRenderer with clamp logic */}
							<QuillRenderer
								content={
									currentProduct?.description ||
									"A study in form and silhouette."
								}
								className="line-clamp-2 overflow-hidden text-ellipsis italic font-light text-muted-foreground! ql-editor-no-padding"
							/>
						</motion.div>
					</AnimatePresence>

					<div className="flex flex-col sm:flex-row gap-4 mt-4">
						<Button
							variant="outline"
							onClick={scrollToShop}
							className="rounded-none border-foreground text-foreground hover:bg-foreground hover:text-background px-12 py-7 text-xs tracking-[0.2em] transition-all duration-500 uppercase"
						>
							The Collection
						</Button>
						<Button
							variant="default"
							onClick={scrollToShop}
							className="rounded-none px-12 py-7 text-xs tracking-[0.2em] transition-all duration-500 uppercase"
						>
							Shop {currentProduct?.tag?.name || "Atelier"}
						</Button>
					</div>
				</motion.div>
			</div>

			{/* Pagination & Scroll indicators remain the same */}
		</section>
	)
}
