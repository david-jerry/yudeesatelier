"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import {
	FullProductInsertValues,
	fullProductInsertSchema,
	type FullProduct,
} from "@/db/models/product"
import {
	createFullProduct,
	updateFullProduct,
	getTagsAction,
} from "@/actions/products"
import { ResponsiveModal } from "@/components/common/ResponsiveModal"
import { ProductForm } from "./ProductForm"

/**
 * Utility to convert File to Base64 for server-side processing.
 */
const fileToBase64 = (
	file: File,
): Promise<{ base64Data: string; fileName: string }> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.readAsDataURL(file)
		reader.onload = () =>
			resolve({
				base64Data: reader.result as string,
				fileName: file.name,
			})
		reader.onerror = (error) => reject(error)
	})
}

export type ProductModalProps = {
	/**
	 * The product data to populate the form for editing.
	 * If null or omitted, the modal defaults to "Create" mode.
	 */
	initialData?: FullProduct | null
	/**
	 * Callback triggered when the modal is closed.
	 */
	onClose?: () => void
	/**
	 * Optional external control for the modal's open state.
	 */
	isOpen?: boolean
}

export function ProductActionModal({
	initialData,
	onClose,
	isOpen: externalOpen,
}: ProductModalProps) {
	const [isOpen, setIsOpen] = React.useState(externalOpen ?? !!initialData)
	const [files, setFiles] = React.useState<File[]>([])
	const [imagesToDelete, setImagesToDelete] = React.useState<string[]>([])

	const queryClient = useQueryClient()

	// Sync external open state
	React.useEffect(() => {
		if (externalOpen !== undefined) setIsOpen(externalOpen)
	}, [externalOpen])

	// Fetch existing tags for the dropdown
	const { data: tagsRes } = useQuery({
		queryKey: ["tags_list"],
		queryFn: async () => await getTagsAction(),
	})

	const defaultValues: Partial<FullProductInsertValues> =
		React.useMemo(() => {
			if (initialData) {
				return {
					name: initialData.name,
					slug: initialData.slug,
					description: initialData.description || "",
					basePrice: initialData.basePrice,
					quantity: initialData.quantity,
					featured: initialData.featured,
					tagId: initialData.tagId || undefined,
					sizeVariants:
						initialData.sizeVariants?.map((v) => ({
							id: v.id,
							size: v.size,
							extraAmount: v.extraAmount,
							measurements:
								v.measurements?.map((m) => ({
									id: m.id,
									key: m.key,
									value: m.value,
									unit: m.unit,
								})) || [],
						})) || [],
				}
			}
			return {
				name: "",
				slug: "",
				basePrice: "0.00",
				quantity: "1",
				featured: false,
				sizeVariants: [
					{ size: "M", extraAmount: "0.00", measurements: [] },
				],
			}
		}, [initialData])

	const form = useForm<FullProductInsertValues>({
		resolver: zodResolver(fullProductInsertSchema),
		defaultValues,
	})

	const { mutate, isPending } = useMutation({
		mutationFn: async (values: FullProductInsertValues) => {
			const base64Images = await Promise.all(files.map(fileToBase64))

			if (initialData?.id) {
				return await updateFullProduct(
					{ ...values, id: initialData.id },
					base64Images,
					imagesToDelete,
				)
			}
			return await createFullProduct(values, base64Images)
		},
		onSuccess: (res) => {
			if (res.success) {
				toast.success(res.message)
				queryClient.invalidateQueries({ queryKey: ["products_list"] })
				queryClient.invalidateQueries({ queryKey: ["tags_list"] })
				handleClose()
			} else {
				toast.error(res.message)
			}
		},
	})

	const handleClose = () => {
		setIsOpen(false)
		form.reset(defaultValues)
		setFiles([])
		setImagesToDelete([])
		onClose?.()
	}

	return (
		<ResponsiveModal
			open={isOpen}
			onOpenChange={(open) => !open && handleClose()}
			title={initialData ? "Edit Atelier Piece" : "Create New Piece"}
			size="xl"
			formResolver={form}
		>
			<ProductForm
				form={form}
				onSubmit={(values) => mutate(values)}
				isPending={isPending}
				files={files}
				setFiles={setFiles}
				existingImages={initialData?.images}
				availableTags={tagsRes?.data || []}
				onDeleteExistingImage={(urlId) =>
					setImagesToDelete((p) => [...p, urlId])
				}
			/>
		</ResponsiveModal>
	)
}
