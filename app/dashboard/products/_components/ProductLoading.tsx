import { Skeleton } from "@/components/ui/skeleton"

export function ProductListSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8 space-y-10">
			{/* Header Skeleton */}
			<header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/60">
				<div className="space-y-3">
					<Skeleton className="h-12 w-64 bg-primary/5" />
					<Skeleton className="h-3 w-40 bg-muted/20" />
				</div>
				<div className="flex items-center gap-4">
					<Skeleton className="h-8 w-48 rounded-none" />
					<Skeleton className="h-9 w-9 rounded-full" />
				</div>
			</header>

			{/* List Skeleton */}
			<div className="grid grid-cols-1 gap-px bg-border/40 border-y border-border/40">
				{[...Array(6)].map((_, i) => (
					<div
						key={i}
						className="flex flex-col sm:flex-row items-center gap-6 py-6 bg-background sm:px-4"
					>
						{/* Image Aspect Skeleton (3:4 ratio) */}
						<div className="relative aspect-3/4 w-32 sm:w-24 bg-secondary/50">
							<Skeleton className="h-full w-full rounded-none" />
						</div>

						{/* Info Section Skeleton */}
						<div className="flex-1 text-center sm:text-left space-y-3">
							<Skeleton className="h-5 w-48 mx-auto sm:mx-0" />
							<Skeleton className="h-3 w-32 mx-auto sm:mx-0" />
						</div>

						{/* Metrics Skeleton */}
						<div className="flex items-center gap-8 px-4 sm:px-0">
							<div className="flex flex-col items-center sm:items-end min-w-20 space-y-2">
								<Skeleton className="h-2 w-10" />
								<Skeleton className="h-4 w-16" />
							</div>
							<div className="flex flex-col items-center sm:items-end min-w-15 space-y-2">
								<Skeleton className="h-2 w-10" />
								<Skeleton className="h-4 w-8" />
							</div>
						</div>

						{/* Action Skeleton */}
						<div className="sm:ml-4">
							<Skeleton className="h-8 w-8 rounded-full" />
						</div>
					</div>
				))}
			</div>

			<div className="flex flex-col items-center justify-center py-10 opacity-30">
				<span className="text-[10px] uppercase tracking-[0.4em] font-mono animate-pulse">
					Curating Archive...
				</span>
			</div>
		</div>
	)
}
