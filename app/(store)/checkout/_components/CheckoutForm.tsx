"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, ArrowRight } from "lucide-react"

import {
	Field,
	FieldError,
	FieldLabel,
	FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { createOrder } from "@/actions/orders"
import { initializePayment } from "@/actions/paystack"
import { useCartStore } from "@/hooks/useZustand"
import { formatPrice } from "@/lib/formatters"
import { useAuth } from "@/hooks/useAuth"
import { PhoneInputField } from "@/components/common/inputs/PhoneNumberInput"

const checkoutSchema = z.object({
	email: z
		.email("A valid email is required for the archive receipt."),
	fullName: z.string().min(2, "Name is required"),
	shippingAddress: z.string().min(5, "Full street address is required"),
	shippingCity: z.string().min(2, "City is required"),
	shippingState: z.string().min(2, "State is required"),
	shippingPostalCode: z.string().optional(),
	shippingCountry: z.string().min(2, "Country is required"),
	phone: z.string().min(10, "Valid phone number is required"),
})

type CheckoutValues = z.infer<typeof checkoutSchema>

export default function CheckoutForm() {
	const { items } = useCartStore()
    const { user } = useAuth()
	const [isProcessing, setIsProcessing] = React.useState(false)
	const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

	const form = useForm<CheckoutValues>({
        // @ts-expect-error expected error with RHF
		resolver: zodResolver(checkoutSchema),
		defaultValues: {
			email: user?.email ?? "",
			fullName: user?.name ?? "",
			shippingAddress: "",
			shippingCity: "",
			shippingState: "",
			shippingPostalCode: "",
			shippingCountry: "Nigeria",
			phone: "",
		},
	})

	async function onSubmit(values: CheckoutValues) {
		if (items.length === 0) return toast.error("Archive is empty")

		setIsProcessing(true)
		try {
			// Corrected to match CreateOrderInput['cartItems']
			const cartItems = items.map((item) => ({
                productId: item.productId,
				variantId: item.variantId,
				quantity: item.quantity,
				price: item.price,
			}))

			// Corrected to match CreateOrderInput structure
			const orderRes = await createOrder({
				guestEmail: !user ? values.email : undefined,
				cartItems: cartItems,
				shipping: {
					fullName: values.fullName,
					address: values.shippingAddress,
					city: values.shippingCity,
					state: values.shippingState,
					postalCode: values.shippingPostalCode,
					country: values.shippingCountry,
					phone: values.phone,
				},
			})

			if (!orderRes.success || !orderRes.data?.orderId || !orderRes.data?.authorizationUrl)
				throw new Error(orderRes.message)

			
			window.location.href = orderRes.data.authorizationUrl
		} catch (error: any) {
			toast.error("Transaction Error", { description: error.message })
		} finally {
			setIsProcessing(false)
		}
	}

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className="container mx-auto space-y-16 py-12"
		>
			{/* 01. Identification */}
			<div className="space-y-8">
				<div className="flex items-center gap-4">
					<span className="text-[10px] font-mono border px-2 py-1 uppercase tracking-tighter">
						Section 01
					</span>
					<Separator className="flex-1" />
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
					<Controller
						name="email"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel className="uppercase text-[11px] tracking-widest font-semibold">
									Email Correspondence
								</FieldLabel>
								<Input
									{...field}
									placeholder="email@example.com"
									aria-invalid={fieldState.invalid}
									className="rounded-none border-x-0 border-t-0 bg-transparent focus-visible:ring-0 px-0"
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Controller
						name="phone"
						control={form.control}
						render={({ field, fieldState }) => (
							<PhoneInputField
								label="Contact Number"
								field={field}
								fieldState={fieldState}
								placeholder="+234..."
								required
								// You can keep your specific minimalist styling via className
								className="col-span-1"
								inputClassName="rounded-none border-x-0 border-t-0 bg-transparent focus-visible:ring-0 px-0"
							/>
						)}
					/>
				</div>
			</div>

			{/* 02. Logistics */}
			<div className="space-y-8">
				<div className="flex items-center gap-4">
					<span className="text-[10px] font-mono border px-2 py-1 uppercase tracking-tighter">
						Section 02
					</span>
					<Separator className="flex-1" />
				</div>

				<div className="space-y-10">
					<Controller
						name="fullName"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel className="uppercase text-[11px] tracking-widest font-semibold">
									Full Legal Name
								</FieldLabel>
								<Input
									{...field}
									aria-invalid={fieldState.invalid}
									className="rounded-none border-x-0 border-t-0 bg-transparent focus-visible:ring-0 px-0"
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>

					<Controller
						name="shippingAddress"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel className="uppercase text-[11px] tracking-widest font-semibold">
									Shipping Address
								</FieldLabel>
								<Input
									{...field}
									placeholder="Street name and House number"
									aria-invalid={fieldState.invalid}
									className="rounded-none border-x-0 border-t-0 bg-transparent focus-visible:ring-0 px-0"
								/>
								<FieldDescription className="font-serif italic text-[12px]">
									Please ensure address is accessible for
									courier delivery.
								</FieldDescription>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>

					<div className="grid grid-cols-2 md:grid-cols-3 gap-8">
						<Controller
							name="shippingCity"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className="uppercase text-[10px] tracking-widest">
										City
									</FieldLabel>
									<Input
										{...field}
										aria-invalid={fieldState.invalid}
										className="rounded-none border-x-0 border-t-0 bg-transparent focus-visible:ring-0 px-0"
									/>
								</Field>
							)}
						/>
						<Controller
							name="shippingState"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className="uppercase text-[10px] tracking-widest">
										State
									</FieldLabel>
									<Input
										{...field}
										aria-invalid={fieldState.invalid}
										className="rounded-none border-x-0 border-t-0 bg-transparent focus-visible:ring-0 px-0"
									/>
								</Field>
							)}
						/>
						<Controller
							name="shippingPostalCode"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel className="uppercase text-[10px] tracking-widest">
										Zip Code
									</FieldLabel>
									<Input
										{...field}
										aria-invalid={fieldState.invalid}
										className="rounded-none border-x-0 border-t-0 bg-transparent focus-visible:ring-0 px-0"
									/>
								</Field>
							)}
						/>
					</div>
				</div>
			</div>

			<Button
				type="submit"
				disabled={isProcessing}
				className="w-full h-16 bg-black text-white hover:bg-neutral-900 rounded-none uppercase font-mono tracking-[0.3em] text-xs transition-all flex items-center justify-between px-8"
			>
				{isProcessing ? (
					<Loader2 className="h-4 w-4 animate-spin mx-auto" />
				) : (
					<>
						<span>Authorize Payment</span>
						<span className="flex items-center gap-2">
							{formatPrice({
								amount: subtotal,
								isKobo: false,
							})}{" "}
							<ArrowRight className="h-4 w-4" />
						</span>
					</>
				)}
			</Button>
		</form>
	)
}
