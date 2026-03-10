import { Skeleton } from "@/components/ui/skeleton"

export function RequestRegistrySkeleton() {
	return (
		<div className="container mx-auto px-6 py-10 space-y-10">
			{/* Header Skeleton */}
			<header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/40 pb-10">
				<div className="space-y-3">
					<Skeleton className="h-12 w-64 bg-primary/5" />
					<Skeleton className="h-3 w-40 bg-muted/20" />
				</div>
			</header>

			{/* List Skeleton */}
			<div className="grid grid-cols-1 border-t border-border/40">
				{[...Array(5)].map((_, i) => (
					<div
						key={i}
						className="flex flex-col md:flex-row items-center gap-8 py-10 px-6 border-b border-border/40"
					>
						{/* Status/ID Section */}
						<div className="flex flex-col items-center md:items-start min-w-35 space-y-2">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-6 w-24 rounded-none" />
						</div>

						{/* Main Info Section */}
						<div className="flex-1 space-y-4">
							<div className="flex items-center justify-center md:justify-start gap-3">
								<Skeleton className="h-5 w-5 rounded-full" />
								<Skeleton className="h-3 w-32" />
							</div>
							<Skeleton className="h-8 w-3/4 mx-auto md:mx-0" />
						</div>

						{/* Volume Section */}
						<div className="hidden lg:flex flex-col items-end min-w-30 space-y-2">
							<Skeleton className="h-3 w-12" />
							<Skeleton className="h-6 w-20" />
						</div>
					</div>
				))}
			</div>

			{/* Subtle loading message at the bottom */}
			<div className="flex flex-col items-center justify-center py-10 opacity-40">
				<span className="font-serif italic text-sm animate-pulse">
					Syncing atelier requests...
				</span>
			</div>
		</div>
	)
}
