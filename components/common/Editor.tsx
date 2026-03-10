/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamic import with SSR disabled
const ReactQuill = dynamic(() => import("react-quill-new"), {
	ssr: false,
	loading: () => <EditorSkeleton />,
})

// Import CSS only on client
import "react-quill-new/dist/quill.snow.css"

const modules = {
	toolbar: [
		[{ header: [1, 2, 3, false] }],
		["bold", "italic", "underline", "strike", "blockquote"],
		[{ list: "ordered" }, { indent: "-1" }, { indent: "+1" }],
		["link", "image"],
		["clean"],
	],
}

const formats = [
	"header",
	"bold",
	"italic",
	"underline",
	"strike",
	"blockquote",
	"list",
	"indent",
	"link",
	"image",
]

interface EditorProps {
	field: any
	placeholder?: string
}

export default function Editor({
	field,
	placeholder = "Write something...",
}: EditorProps) {
	const [isClient, setIsClient] = useState(false)

	// Ensure we're on the client
	React.useEffect(() => {
		setIsClient(true)
	}, [])

	// Memoize the dynamic component to prevent re-renders
	const QuillEditor = useMemo(() => ReactQuill, [])

	// Show skeleton until client + Quill is ready
	if (!isClient) {
		return <EditorSkeleton />
	}

	return (
		<div className="quill-container">
			<QuillEditor
				theme="snow"
				value={field.value}
				onChange={field.onChange}
				modules={modules}
				formats={formats}
				placeholder={placeholder}
				className="bg-card text-foreground w-full quill-editor rounded-xl"
			/>
		</div>
	)
}

// Skeleton component (shown while loading)
function EditorSkeleton() {
	return (
		<div className="bg-card border rounded-md overflow-hidden">
			{/* Toolbar */}
			<div className="border-b border-border p-2 flex flex-wrap gap-1">
				{[...Array(15)].map((_, i) => (
					<Skeleton
						key={i}
						className="h-8 w-8 rounded animate-pulse"
					/>
				))}
			</div>
			{/* Editor body */}
			<div className="p-4 space-y-3 min-h-50">
				<Skeleton className="h-4 w-3/4 rounded animate-pulse" />
				<Skeleton className="h-4 w-1/2 rounded animate-pulse" />
				<Skeleton className="h-4 w-5/6 rounded animate-pulse" />
				<Skeleton className="h-4 w-2/3 rounded animate-pulse" />
			</div>
		</div>
	)
}
