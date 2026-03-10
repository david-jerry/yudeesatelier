import { Skeleton } from "@/components/ui/skeleton"

export default function ReviewRegistryLoading() {
	return (
		<div className="container mx-auto px-6 py-10 space-y-10">
			{/* Header Skeleton */}
			<header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/40 pb-10">
				<div className="space-y-3">
					<Skeleton className="h-12 w-64 bg-primary/5" />
					<Skeleton className="h-3 w-40 bg-muted/20" />
				</div>
				<Skeleton className="h-10 w-full md:w-64 bg-muted/10 rounded-none" />
			</header>

			{/* List Skeleton */}
			<div className="grid grid-cols-1">
				{[...Array(5)].map((_, i) => (
					<div
						key={i}
						className="flex flex-col md:flex-row items-center gap-10 py-12 px-6 border-b border-border/40"
					>
						{/* Rating Skeleton */}
						<div className="flex flex-col items-center gap-2">
							<Skeleton className="h-10 w-12 bg-primary/5" />
							<div className="flex gap-0.5">
								{[...Array(5)].map((_, j) => (
									<Skeleton
										key={j}
										className="h-2.5 w-2.5 rounded-full"
									/>
								))}
							</div>
						</div>

						{/* Content Skeleton */}
						<div className="flex-1 space-y-4">
							<div className="flex items-center justify-center md:justify-start gap-3">
								<Skeleton className="h-6 w-6 rounded-full" />
								<Skeleton className="h-3 w-24" />
								<Skeleton className="h-4 w-20" />
							</div>
							<div className="space-y-2">
								<Skeleton className="h-6 w-full max-w-2xl bg-muted/10" />
								<Skeleton className="h-6 w-3/4 max-w-xl bg-muted/10" />
							</div>
						</div>

						{/* Stats Skeleton */}
						<div className="hidden lg:block">
							<div className="flex flex-col items-end gap-2">
								<Skeleton className="h-2 w-16" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Bottom Spinner for UX continuity */}
			<div className="flex flex-col items-center justify-center py-10 opacity-40">
				<span className="font-serif italic text-sm animate-pulse">
					Synchronizing Archives...
				</span>
			</div>
		</div>
	)
}
