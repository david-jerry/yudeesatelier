"use client"

import { useState } from "react"
import { ProductCard } from "./ProductCard"
import { FullProduct } from "@/db/models/product"
import { ResponsiveModal } from "@/components/common/ResponsiveModal"
import { ProductPreviewContent } from "./PreviewContent"

export function ProductPreviewWrapper({ product }: { product: FullProduct }) {
	const [open, setOpen] = useState(false)

	return (
		<ResponsiveModal
			open={open}
			onOpenChange={setOpen}
			title={product.name}
			description={`Previewing ${product.name} from the Atelier collection.`}
			size="xl"
			// Using shadcn tokens for consistent theme scaling
			className="border-border bg-background max-w-5xl!"
			trigger={
				<div className="cursor-pointer">
					<ProductCard product={product} />
				</div>
			}
		>
			<ProductPreviewContent
				product={product}
				closeModal={() => setOpen(false)}
			/>
		</ResponsiveModal>
	)
}
