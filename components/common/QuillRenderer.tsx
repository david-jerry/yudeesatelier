"use client"

import { useMemo } from "react"
import DOMPurify from "isomorphic-dompurify"
import { cn } from "@/lib/utils" // shadcn helper
import "react-quill/dist/quill.snow.css"

interface QuillRendererProps {
	content: string
	className?: string
}

export default function QuillRenderer({
	content,
	className,
}: QuillRendererProps) {
	const cleanHTML = useMemo(() => {
		return typeof window !== "undefined"
			? DOMPurify.sanitize(content)
			: content
	}, [content])

	return (
		<div className={cn("w-full", className)}>
			<div
				className={cn(
					// Base Quill class
					"ql-editor",
					// Base Typography
					"prose prose-sm max-w-none dark:prose-invert",
					// shadcn UI variable mapping
					"prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground",
					"prose-a:text-primary underline-offset-4 hover:prose-a:text-primary/80",
					"prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
					"prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
					"prose-img:rounded-md prose-img:border prose-img:w-64",
					"prose-hr:border-border",
					// Spacing
					"gap-2",
				)}
				dangerouslySetInnerHTML={{ __html: cleanHTML }}
			/>
		</div>
	)
}
