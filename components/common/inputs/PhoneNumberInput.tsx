"use client"

import * as React from "react"
import PhoneInput, { type Value } from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
	Field,
	FieldLabel,
	FieldDescription,
	FieldError,
} from "@/components/ui/field"
import type {
	ControllerRenderProps,
	ControllerFieldState,
} from "react-hook-form"

/**
 * Core Shadcn-styled Input for the phone library
 */
const PhoneInputComponent = React.forwardRef<
	HTMLInputElement,
	React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
	<Input
		autoComplete="tel"
		type="tel"
		className={cn(
			"rounded-none border-x-0 border-t-0 bg-transparent focus-visible:ring-0 px-0",
			className,
		)}
		ref={ref}
		{...props}
	/>
))
PhoneInputComponent.displayName = "PhoneInputComponent"

interface PhoneInputFieldProps extends Omit<
	React.ComponentProps<typeof PhoneInput>,
	"onChange" | "value"
> {
	label?: string
	description?: string
	required?: boolean
	field: ControllerRenderProps<any, any>
	fieldState: ControllerFieldState
}

/**
 * v4 Atomic Phone Input
 * Designed to be used inside a <Controller /> render prop.
 */
export const PhoneInputField = React.forwardRef<
	HTMLInputElement,
	PhoneInputFieldProps
>(
	(
		{
			label,
			description,
			required,
			className,
			field,
			fieldState,
			...props
		},
		ref,
	) => {
		return (
			<Field
				className={className}
				data-invalid={fieldState.invalid}
			>
				{label && (
					<FieldLabel htmlFor={field.name}>
						{label}{" "}
						{required && (
							<span className="text-destructive">*</span>
						)}
					</FieldLabel>
				)}

				<PhoneInput
					{...field}
					{...props}
					id={field.name}
					international
					ref={ref}
					countryCallingCodeEditable={false}
					defaultCountry="NG"
					inputComponent={PhoneInputComponent}
					className={cn("flex", props.className)}
					aria-invalid={fieldState.invalid}
					value={field.value || ""}
					onChange={(val) => field.onChange(val || "")}
				/>

				{description && (
					<FieldDescription>{description}</FieldDescription>
				)}

				{fieldState.invalid && (
					<FieldError errors={[fieldState.error]} />
				)}
			</Field>
		)
	},
)
PhoneInputField.displayName = "PhoneInputField"

/**
 * Standalone Version (Semantic UI only, no RHF context)
 */
export function PhoneInputStandalone({
	label,
	error,
	required,
	className,
	value,
	onChange,
	id,
	...props
}: {
	label?: string
	error?: string
	required?: boolean
	value: Value
	onChange: (val: Value) => void
} & Omit<React.ComponentProps<typeof PhoneInput>, "onChange" | "value">) {
	return (
		<div className={cn("space-y-2", className)}>
			{label && (
				<FieldLabel htmlFor={id}>
					{label}{" "}
					{required && <span className="text-destructive">*</span>}
				</FieldLabel>
			)}
			<PhoneInput
				{...props}
				id={id}
				international
				countryCallingCodeEditable={false}
				defaultCountry="NG"
				value={value}
				onChange={onChange}
				inputComponent={PhoneInputComponent}
				className={cn(
					"flex",
					error &&
						"[&_input]:border-destructive [&_input]:focus-visible:ring-destructive",
				)}
			/>
			{error && <FieldError errors={[{ message: error } as any]} />}
		</div>
	)
}
