"use client"

import { useState, useMemo } from "react"
import { AboutSection } from "@/app/_components/AboutSection"
import { FilterSidebar } from "@/app/_components/FilterSidebar"
import { Hero } from "@/app/_components/Hero"
import { ProductPreviewWrapper } from "@/app/_components/PreviewWrapper"
import { useStorefront } from "@/hooks/useStorefront"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { config } from "@/config"

export default function ShopLanding() {
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const [maxPrice, setMaxPrice] = useState<number>(1000000)

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

    // 2. Memoized Filtering & Flattening
    const filteredProducts = useMemo(() => {
        if (!data) return []

        const allLoadedProducts = data.pages.flatMap(
            (page) => page.products?.records || [],
        )

        return allLoadedProducts.filter((p) => {
            if (!p) return false

            /**
             * CORRECT TAG DETAIL LOGIC:
             * Since FullProduct type defines 'tag' as a Tag object:
             * We check p.tag.slug (the slug inside the joined object)
             * against activeTag (the slug string from state).
             */
            const matchesTag = activeTag ? p.tag?.slug === activeTag : true

            const matchesPrice = Number(p.basePrice) <= maxPrice

            return matchesTag && matchesPrice
        })
    }, [data, activeTag, maxPrice])

    // 3. Current Tag Label logic
    const currentTagName = useMemo(() => {
        if (!activeTag) return "New Arrivals"
        // Find the tag in the local tags list to display the 'name' (string), not the object
        const found = tags.find((t) => t.slug === activeTag)
        return found ? found.name : "Collection"
    }, [activeTag, tags])

    return (
        <div className="bg-background min-h-screen selection:bg-primary selection:text-primary-foreground w-full">
            <section
                id="shop"
                className="container mx-auto py-32 px-6"
            >
                <div className="flex flex-col md:flex-row gap-16">
                    <aside className="w-full md:w-64 shrink-0">
                        <FilterSidebar
                            tags={tags}
                            activeTag={activeTag}
                            onTagChange={setActiveTag}
                            priceRange={maxPrice}
                            onPriceChange={setMaxPrice}
                        />
                    </aside>

                    <div className="flex-1 space-y-12">
                        <div className="flex justify-between items-end border-b border-border pb-8">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-serif text-foreground tracking-tight uppercase">
                                    {currentTagName}
                                </h2>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                                    {config.TITLE || "Atelier"} • 2026
                                </p>
                            </div>
                            {!isLoading && (
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                    {filteredProducts.length} Pieces Displayed
                                </span>
                            )}
                        </div>

                        {isLoading && (
                            <div className="h-[50vh] flex flex-col items-center justify-center space-y-4">
                                <Loader2
                                    className="animate-spin text-muted-foreground/30"
                                    size={32}
                                />
                                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
                                    Synchronizing Archive
                                </p>
                            </div>
                        )}

                        {isError && (
                            <div className="h-[40vh] flex flex-col items-center justify-center border border-destructive/20 bg-destructive/5 rounded-sm p-8 text-center">
                                <AlertCircle
                                    className="text-destructive mb-4"
                                    size={24}
                                />
                                <p className="text-sm font-serif italic text-foreground">
                                    The digital archive is momentarily locked.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-6 uppercase text-[10px] tracking-widest"
                                    onClick={() => window.location.reload()}
                                >
                                    Retry Connection
                                </Button>
                            </div>
                        )}

                        {!isLoading && !isError && (
                            <>
                                {filteredProducts.length > 0 ? (
                                    <div className="space-y-20">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
                                            {filteredProducts.map((product) => (
                                                <ProductPreviewWrapper
                                                    key={product.id}
                                                    product={product}
                                                />
                                            ))}
                                        </div>

                                        {hasNextPage && (
                                            <div className="flex justify-center pt-10">
                                                <Button
                                                    variant="ghost"
                                                    disabled={
                                                        isFetchingNextPage
                                                    }
                                                    onClick={() =>
                                                        fetchNextPage()
                                                    }
                                                    className="uppercase text-[10px] tracking-[0.3em] hover:bg-transparent hover:underline"
                                                >
                                                    {isFetchingNextPage
                                                        ? "Syncing..."
                                                        : "Load More Pieces"}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-96 flex flex-col items-center justify-center border border-dashed border-border rounded-sm bg-muted/30">
                                        <p className="text-muted-foreground font-serif italic text-lg">
                                            No pieces found for this selection.
                                        </p>
                                        <Button
                                            variant="link"
                                            onClick={() => {
                                                setActiveTag(null)
                                                setMaxPrice(1000000)
                                            }}
                                            className="text-[10px] uppercase tracking-widest text-foreground px-0 mt-4"
                                        >
                                            Reset Filters
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
