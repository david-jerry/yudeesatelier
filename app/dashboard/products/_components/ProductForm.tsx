"use client"

import * as React from "react"
import { useFieldArray, UseFormReturn, Controller } from "react-hook-form"
import {
	Plus,
	X,
	ImageIcon,
	Upload,
	Trash2,
	Star,
	Tag as TagIcon,
	ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldError,
} from "@/components/ui/field"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import Editor from "@/components/common/Editor"
import { FullProductInsertValues } from "@/db/models/product"
import { MeasurementsArray } from "./MeasurementsArray"
import { cn } from "@/lib/utils"
import Image from "next/image"

const SIZE_OPTIONS = [
	{ label: "Extra Small", value: "XS" },
	{ label: "Small", value: "S" },
	{ label: "Medium", value: "M" },
	{ label: "Large", value: "L" },
	{ label: "Extra Large", value: "XL" },
	{ label: "Double XL", value: "XXL" },
	{ label: "One Size", value: "OS" },
]

interface ProductFormProps {
	form: UseFormReturn<FullProductInsertValues>
	onSubmit: (values: FullProductInsertValues) => void
	isPending: boolean
	files: File[]
	setFiles: React.Dispatch<React.SetStateAction<File[]>>
	existingImages?: { url: string; urlId: string }[]
	onDeleteExistingImage: (urlId: string) => void
	availableTags?: { name: string; slug: string }[]
}

export function ProductForm({
	form,
	onSubmit,
	isPending,
	files,
	setFiles,
	existingImages = [],
	onDeleteExistingImage,
	availableTags = [],
}: ProductFormProps) {
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "sizeVariants",
	})

	const [isCreatingNewTag, setIsCreatingNewTag] = React.useState(false)
	const [newTagName, setNewTagName] = React.useState("")

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const newFiles = Array.from(e.target.files)
			setFiles((prev) => [...prev, ...newFiles])
		}
	}

	const handleCreateTag = () => {
		if (!newTagName) return
		const slug = newTagName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
		form.setValue("tagId", slug, { shouldDirty: true })
		setIsCreatingNewTag(false)
		setNewTagName("")
	}

	return (
		<form
			id="product-action-form"
			onSubmit={form.handleSubmit(onSubmit)}
			className="space-y-12 pb-10"
		>
			{/* --- Media Gallery Section --- */}
			<section className="space-y-4">
				<div className="flex items-center justify-between border-b border-primary/10 pb-2">
					<h3 className="font-serif text-sm uppercase tracking-[0.2em]">
						Visual Archive
					</h3>
					<label className="cursor-pointer group flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
						<Upload className="h-3 w-3" />
						Upload Media
						<input
							type="file"
							multiple
							className="hidden"
							onChange={handleFileChange}
							accept="image/*"
						/>
					</label>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{/* Existing Images (Cloudinary) */}
					{existingImages.map((img) => (
						<div
							key={img.urlId}
							className="relative aspect-3/4 bg-secondary/20 overflow-hidden group"
						>
							<Image
								src={img.url}
								alt="Product"
								fill
								className="object-cover transition-transform duration-500 group-hover:scale-105"
							/>
							<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
								<Button
									type="button"
									variant="destructive"
									size="icon"
									className="h-8 w-8 rounded-none"
									onClick={() =>
										onDeleteExistingImage(img.urlId)
									}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}

					{/* New Files (Local Preview) */}
					{files.map((file, idx) => (
						<div
							key={idx}
							className="relative aspect-3/4 border border-dashed border-primary/20 bg-primary/5 flex items-center justify-center overflow-hidden group"
						>
							<Image
								src={URL.createObjectURL(file)}
								alt="Preview"
								fill
								className="object-cover opacity-60"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute top-1 right-1 h-6 w-6 rounded-none bg-background/80 hover:bg-destructive hover:text-white"
								onClick={() =>
									setFiles(files.filter((_, i) => i !== idx))
								}
							>
								<X className="h-3 w-3" />
							</Button>
							<span className="absolute bottom-2 left-2 text-[8px] uppercase tracking-tighter bg-background/90 px-1">
								New Upload
							</span>
						</div>
					))}

					{/* Placeholder Slot */}
					{files.length === 0 && existingImages.length === 0 && (
						<div className="col-span-full h-40 flex flex-col items-center justify-center border border-dashed border-primary/10 bg-secondary/5 text-muted-foreground">
							<ImageIcon className="h-5 w-5 mb-2 opacity-20" />
							<span className="text-[10px] uppercase tracking-widest opacity-50">
								No media curated
							</span>
						</div>
					)}
				</div>
			</section>

			{/* --- Core Identity Section --- */}
			<FieldGroup>
				<div className="flex justify-between items-end border-b border-primary/10 pb-2 mb-4">
					<h3 className="font-serif text-sm uppercase tracking-[0.2em]">
						Core Identity
					</h3>
					<Controller
						name="featured"
						control={form.control}
						render={({ field }) => (
							<div className="flex items-center space-x-2 mb-1">
								<Checkbox
									id="featured"
									checked={field.value}
									onCheckedChange={field.onChange}
									className="rounded-none border-primary/30"
								/>
								<label
									htmlFor="featured"
									className="text-[10px] uppercase tracking-widest cursor-pointer flex items-center"
								>
									<Star
										className={cn(
											"h-3 w-3 mr-1",
											field.value &&
												"fill-primary text-primary",
										)}
									/>
									Featured
								</label>
							</div>
						)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
					<div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
						<Controller
							name="name"
							control={form.control}
							render={({
								field: { onChange, ...field },
								fieldState,
							}) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Piece Name
									</FieldLabel>
									<Input
										{...field}
										onChange={(e) => {
											const { name, slug } =
												formatIdentity(e.target.value)
											onChange(name)
											form.setValue("slug", slug, {
												shouldValidate: true,
											})
										}}
										className="rounded-none border-primary/20"
									/>
									<FieldError errors={[fieldState.error]} />
								</Field>
							)}
						/>
						<Controller
							name="slug"
							control={form.control}
							render={({ field }) => (
								<Field>
									<FieldLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Reference Slug
									</FieldLabel>
									<Input
										{...field}
										readOnly
										className="rounded-none border-primary/10 bg-secondary/20 font-mono text-[10px]"
									/>
								</Field>
							)}
						/>
					</div>

					<Controller
						name="basePrice"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
									Base Price
								</FieldLabel>
								<Input
									{...field}
									placeholder="0.00"
									className="rounded-none border-primary/20 font-mono"
								/>
								<FieldError errors={[fieldState.error]} />
							</Field>
						)}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
					<Controller
						name="tagId"
						control={form.control}
						render={({ field }) => (
							<Field>
								<div className="flex justify-between items-center mb-1">
									<FieldLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Collection Tag
									</FieldLabel>
									<Button
										variant="link"
										type="button"
										onClick={() =>
											setIsCreatingNewTag(
												!isCreatingNewTag,
											)
										}
										className="h-auto p-0 text-[9px] uppercase tracking-tighter"
									>
										{isCreatingNewTag
											? "Select Existing"
											: "+ New Tag"}
									</Button>
								</div>
								{isCreatingNewTag ? (
									<div className="flex gap-2">
										<Input
											placeholder="Tag Name..."
											value={newTagName}
											onChange={(e) =>
												setNewTagName(e.target.value)
											}
											className="h-9 rounded-none text-[11px]"
										/>
										<Button
											type="button"
											onClick={handleCreateTag}
											size="sm"
											className="rounded-none h-9"
										>
											Add
										</Button>
									</div>
								) : (
									<Select
										onValueChange={field.onChange}
										value={field.value}
									>
										<SelectTrigger className="rounded-none h-9 border-primary/20 text-[11px]">
											<SelectValue placeholder="Assign to Tag" />
										</SelectTrigger>
										<SelectContent className="rounded-none">
											{availableTags.map((t) => (
												<SelectItem
													key={t.slug}
													value={t.slug}
													className="text-[11px]"
												>
													{t.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</Field>
						)}
					/>

					<Controller
						name="quantity"
						control={form.control}
						render={({ field }) => (
							<Field>
								<FieldLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
									Inventory Quantity
								</FieldLabel>
								<Input
									{...field}
									className="rounded-none border-primary/20"
								/>
							</Field>
						)}
					/>
				</div>

				<Controller
					name="description"
					control={form.control}
					render={({ field }) => (
						<Field>
							<FieldLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
								Narrative
							</FieldLabel>
							<Editor field={field} />
						</Field>
					)}
				/>
			</FieldGroup>

			{/* --- Size Variants Section --- */}
			<section className="space-y-6">
				<div className="flex items-center justify-between border-b border-primary/10 pb-2">
					<h3 className="font-serif text-sm uppercase tracking-[0.2em]">
						Size & Geometry
					</h3>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="rounded-none h-7 text-[9px] uppercase tracking-widest"
						onClick={() =>
							append({
								size: "M",
								extraAmount: "0.00",
								measurements: [],
							})
						}
					>
						<Plus className="h-3 w-3 mr-1" /> Add Variant
					</Button>
				</div>

				<div className="space-y-8">
					{fields.map((field, index) => (
						<div
							key={field.id}
							className="p-6 border border-primary/5 bg-secondary/5 relative group"
						>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
								onClick={() => remove(index)}
							>
								<X className="h-3 w-3" />
							</Button>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
								<Controller
									name={`sizeVariants.${index}.size`}
									control={form.control}
									render={({ field }) => (
										<Field>
											<FieldLabel className="text-[9px] uppercase tracking-widest">
												Dimension
											</FieldLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger className="rounded-none bg-background">
													<SelectValue />
												</SelectTrigger>
												<SelectContent className="rounded-none">
													{SIZE_OPTIONS.map((opt) => (
														<SelectItem
															key={opt.value}
															value={opt.value}
														>
															{opt.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</Field>
									)}
								/>
								<Controller
									name={`sizeVariants.${index}.extraAmount`}
									control={form.control}
									render={({ field }) => (
										<Field>
											<FieldLabel className="text-[9px] uppercase tracking-widest">
												Surcharge (Optional)
											</FieldLabel>
											<Input
												{...field}
												className="rounded-none bg-background font-mono"
												placeholder="0.00"
											/>
										</Field>
									)}
								/>
							</div>

							{/* Nested Measurements */}
							<MeasurementsArray
								nestIndex={index}
								control={form.control}
							/>
						</div>
					))}
				</div>
			</section>

			<Button
				type="submit"
				disabled={isPending}
				className="w-full rounded-none h-14 bg-primary text-[11px] uppercase tracking-[0.4em] hover:bg-primary/90 transition-all"
			>
				{isPending ? "Archiving Piece..." : "Synchronize Piece"}
			</Button>
		</form>
	)
}

const formatIdentity = (value: string) => {
	const name = value
		.split(" ")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(" ")
	const slug = value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)+/g, "")
	return { name, slug }
}
