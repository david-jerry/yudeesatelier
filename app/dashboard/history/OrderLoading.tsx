import { Skeleton } from "@/components/ui/skeleton"

export function OrderSkeletonList() {
	return (
		<div className="space-y-6">
			{[1, 2, 3].map((i) => (
				<div
					key={i}
					className="border border-neutral-100 bg-white p-6 flex flex-col md:flex-row gap-6"
				>
					<div className="space-y-3 md:w-48">
						<Skeleton className="h-3 w-20 bg-neutral-100 rounded-none" />
						<Skeleton className="h-5 w-32 bg-neutral-100 rounded-none" />
					</div>
					<div className="flex-1 space-y-4">
						<div className="flex justify-between">
							<Skeleton className="h-6 w-1/3 bg-neutral-100 rounded-none" />
							<Skeleton className="h-6 w-24 bg-neutral-100 rounded-none" />
						</div>
						<div className="flex gap-4">
							<Skeleton className="h-4 w-16 bg-neutral-100 rounded-none" />
							<Skeleton className="h-4 w-16 bg-neutral-100 rounded-none" />
						</div>
					</div>
				</div>
			))}
			<p className="font-mono text-[9px] text-center uppercase tracking-[0.3em] text-neutral-300">
				Initializing Ledger Sequence...
			</p>
		</div>
	)
}
