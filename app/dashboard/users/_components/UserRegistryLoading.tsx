import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

/**
 * Skeleton Loader matching the registry row design
 */
export default function UserRegistrySkeleton() {
    return (
        <div className="grid grid-cols-1 border-t border-border/40 animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div 
                    key={i} 
                    className="flex flex-col md:flex-row items-center gap-8 py-10 px-6 border-b border-border/40"
                >
                    {/* Avatar Skeleton */}
                    <Skeleton className="h-20 w-20 rounded-full bg-muted/20" />

                    {/* Name & Email Skeleton */}
                    <div className="flex-1 space-y-3 flex flex-col items-center md:items-start">
                        <Skeleton className="h-8 w-48 bg-muted/20" />
                        <Skeleton className="h-3 w-32 bg-muted/10" />
                    </div>

                    {/* Stats Skeleton */}
                    <div className="flex gap-12">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center md:items-start space-y-2">
                                <Skeleton className="h-2 w-12 bg-muted/10" />
                                <Skeleton className="h-4 w-6 bg-muted/20" />
                            </div>
                        ))}
                    </div>
                    
                    {/* Action Icon Skeleton */}
                    <Skeleton className="h-8 w-8 rounded-md bg-muted/10 hidden md:block" />
                </div>
            ))}
        </div>
    )
}
