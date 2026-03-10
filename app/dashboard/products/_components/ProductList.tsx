"use client"

import * as React from "react"
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query"
import {
	Edit2,
	MoreHorizontal,
	Trash2,
	Search,
	Loader2,
	Image as ImageIcon,
	Plus,
	ShieldAlert,
	ChevronLeft,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FullProduct } from "@/db/models/product"
import { ProductActionModal } from "./ProductFormController"
import { getProducts, deleteProduct } from "@/actions/products"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { IconObjectScan } from "@tabler/icons-react"
import { ProductListSkeleton } from "./ProductLoading"

export function ProductList() {
	const queryClient = useQueryClient()
	const [searchTerm, setSearchTerm] = React.useState("")
	const debouncedSearch = useDebounce(searchTerm, 500)
	const [selectedProduct, setSelectedProduct] =
		React.useState<FullProduct | null>(null)
	const [isModalOpen, setIsModalOpen] = React.useState(false)

	const { isAdmin } = useAuth()

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useInfiniteQuery({
			queryKey: ["products_list", debouncedSearch],
			queryFn: async ({ pageParam }) => {
				const res = await getProducts({
					cursor: pageParam as string | undefined,
					search: debouncedSearch,
				})
				if (!res.success || !res.data)
					throw new Error(res.message || "Failed to fetch")
				return res.data
			},
			initialPageParam: undefined as string | undefined,
			getNextPageParam: (lastPage) =>
				lastPage.pagination.nextCursor ?? undefined,
		})

	const allProducts = React.useMemo(
		() => data?.pages.flatMap((page) => page.records) ?? [],
		[data],
	)

	const { mutate: handleRemove } = useMutation({
		mutationFn: deleteProduct,
		onSuccess: (res) => {
			if (res.success) {
				toast.success(res.message)
				queryClient.invalidateQueries({ queryKey: ["products_list"] })
			} else {
				toast.error(res.message)
			}
		},
	})

	const openModal = (product: FullProduct | null = null) => {
		setSelectedProduct(product)
		setIsModalOpen(true)
	}

	if (!isAdmin) {
		return (
			<div className="container mx-auto px-6 py-40 flex flex-col items-center justify-center space-y-6 text-center">
				<div className="relative">
					<ShieldAlert className="h-16 w-16 text-destructive/40 stroke-[1px]" />
					<div className="absolute inset-0 blur-2xl bg-destructive/10 -z-10" />
				</div>
				<div className="space-y-2">
					<h2 className="text-4xl font-serif italic tracking-tighter">
						Restricted Access
					</h2>
					<p className="text-[10px] uppercase tracking-[0.4em] font-mono text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
						Identity verification failed. This access is reserved
						for administrators only.
					</p>
				</div>
				<Button
					variant="ghost"
					asChild
					className="mt-8 font-mono text-[10px] tracking-widest uppercase hover:bg-transparent hover:text-primary transition-colors"
				>
					<Link href="/dashboard">
						<ChevronLeft className="mr-2 h-3 w-3" /> Return to
						Dashboard
					</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className="container mx-auto px-4 py-8 space-y-10">
			{/* Minimalist Header */}
			<header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/60">
				<div className="space-y-1">
					<h1 className="text-5xl font-serif italic tracking-tighter text-primary">
						The Archive
					</h1>
					<p className="text-[10px] uppercase tracking-[0.4em] font-mono text-muted-foreground/60">
						Atelier Inventory &bull; {allProducts.length} Pieces
					</p>
				</div>

				<div className="flex items-center gap-2">
					<div className="relative group">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
						<Input
							placeholder="Find a piece..."
							className="pl-9 w-full md:w-64 bg-transparent border-none shadow-none focus-visible:ring-0 text-sm italic border-b border-transparent focus:border-border rounded-none transition-all"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<Button
						onClick={() => openModal()}
						variant="ghost"
						size="sm"
						className="hover:bg-primary hover:text-primary-foreground rounded-full h-9 w-9 p-0"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
			</header>

			{/* Content State */}
			{isLoading ? (
				<ProductListSkeleton />
			) : allProducts.length < 1 ? (
				/* EMPTY STATE DESIGN */
				<div className="flex flex-col items-center justify-center py-40 space-y-6 animate-in fade-in zoom-in-95 duration-500">
					<div className="relative">
						<IconObjectScan className="h-12 w-12 text-muted-foreground/20 stroke-[1px]" />
						<div className="absolute inset-0 blur-2xl bg-primary/5 -z-10" />
					</div>
					<div className="text-center space-y-2">
						<h3 className="text-2xl font-serif italic tracking-tight text-muted-foreground/80">
							The archives are currently silent.
						</h3>
						<p className="text-[10px] uppercase tracking-[0.3em] font-mono text-muted-foreground/40">
							{searchTerm
								? `No products matching "${searchTerm}"`
								: "Awaiting new customer requests."}
						</p>
					</div>
					{searchTerm && (
						<Button
							variant="ghost"
							onClick={() => setSearchTerm("")}
							className="text-[9px] font-mono tracking-[0.2em] uppercase text-primary/60 hover:text-primary"
						>
							Reset Search Filters
						</Button>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 gap-px bg-border/40 border-y border-border/40">
					{allProducts.map((product) => (
						<div
							key={product.id}
							className="group flex flex-col sm:flex-row items-center gap-6 py-6 bg-background transition-colors hover:bg-muted/20 sm:px-4"
						>
							{/* Image Aspect - Leaner size */}
							<div className="relative aspect-3/4 w-32 sm:w-24 overflow-hidden bg-secondary">
								{product.images?.[0]?.url ? (
									<Image
										src={product.images[0].url}
										alt={product.name}
										fill
										className="object-cover transition-transform duration-700 group-hover:scale-105"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center">
										<ImageIcon className="h-4 w-4 text-muted-foreground/30" />
									</div>
								)}
							</div>

							{/* Info Section */}
							<div className="flex-1 text-center sm:text-left space-y-1">
								<h3 className="font-serif text-lg leading-none tracking-tight">
									{product.name}
								</h3>
								<p className="text-[10px] font-mono uppercase text-muted-foreground tracking-tighter">
									SKU: {product.slug}
								</p>
							</div>

							{/* Metrics - Desktop & Mobile friendly */}
							<div className="flex items-center gap-8 px-4 sm:px-0">
								<div className="text-center sm:text-right min-w-20">
									<p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
										Price
									</p>
									<p className="font-mono text-sm">
										$
										{Number(
											product.basePrice,
										).toLocaleString()}
									</p>
								</div>
								<div className="text-center sm:text-right min-w-15">
									<p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
										Stock
									</p>
									<p
										className={cn(
											"text-sm font-mono",
											Number(product.quantity) < 5
												? "text-orange-600"
												: "text-primary",
										)}
									>
										{product.quantity}
									</p>
								</div>
							</div>

							{/* Actions */}
							<div className="sm:ml-4">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 rounded-full opacity-60 group-hover:opacity-100"
										>
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="end"
										className="font-serif italic"
									>
										<DropdownMenuItem
											onClick={() => openModal(product)}
										>
											<Edit2 className="mr-2 h-3.5 w-3.5" />{" "}
											Edit Piece
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-destructive"
											onClick={() =>
												confirm(
													"Decommission this piece?",
												) && handleRemove(product.id)
											}
										>
											<Trash2 className="mr-2 h-3.5 w-3.5" />{" "}
											Archive
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Load More - Subtle link style */}
			{hasNextPage && (
				<div className="flex justify-center pt-10">
					<Button
						variant="link"
						disabled={isFetchingNextPage}
						onClick={() => fetchNextPage()}
						className="text-[10px] uppercase tracking-[0.3em] font-bold"
					>
						{isFetchingNextPage ? "Requesting..." : "View More"}
					</Button>
				</div>
			)}

			<ProductActionModal
				key={selectedProduct?.id ?? "new-product"}
				isOpen={isModalOpen}
				initialData={selectedProduct}
				onClose={() => {
					setIsModalOpen(false)
					setSelectedProduct(null)
				}}
			/>
		</div>
	)
}
