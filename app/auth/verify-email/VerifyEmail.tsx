/* eslint-disable react/no-unescaped-entities */
"use client"

import { useEffect, useState, Suspense, useCallback, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/authClient"
import { toast } from "sonner"
import { z } from "zod"
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Field, FieldError } from "@/components/ui/field"
import Logo from "@/components/common/Logo"
import AuthFormFooter from "../_component/AuthFormFooter"

const verifySchema = z.object({
	token: z.string().min(1, { message: "Verification token is required" }),
})

type VerifyFormData = z.infer<typeof verifySchema>

function VerifyEmailContent() {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isVerified, setIsVerified] = useState(false)
	const router = useRouter()
	const searchParams = useSearchParams()
	const tokenParam = searchParams.get("token")

	// Ref to prevent double-submission in Strict Mode
	const hasSubmitted = useRef(false)

	const form = useForm<VerifyFormData>({
		resolver: zodResolver(verifySchema),
		defaultValues: { token: "" },
	})

	const { control, handleSubmit, setValue, setError } = form

	const executeVerification = useCallback(
		async (data: VerifyFormData) => {
			if (isSubmitting || isVerified) return

			setIsSubmitting(true)
			try {
				await authClient.verifyEmail(
					{ query: { token: data.token } },
					{
						onSuccess: async () => {
							toast.success("Identity Synchronized")
							setIsVerified(true)
							setTimeout(() => router.push("/dashboard"), 2000)
						},
						onError: (context) => {
							setError("token", {
								type: "server",
								message:
									context.error?.message || "Invalid token.",
							})
						},
					},
				)
			} catch (err) {
				setError("token", { type: "server", message: "System error." })
			} finally {
				setIsSubmitting(false)
			}
		},
		[isSubmitting, isVerified, router, setError],
	)

	useEffect(() => {
		if (tokenParam && !hasSubmitted.current) {
			hasSubmitted.current = true
			setValue("token", tokenParam)
			executeVerification({ token: tokenParam })
		} else if (!tokenParam) {
			setError("token", { type: "manual", message: "Missing sequence." })
		}
	}, [tokenParam, setValue, setError, executeVerification])

	return (
		<form
			onSubmit={handleSubmit(executeVerification)}
			className="space-y-8"
		>
			<div className="flex flex-col items-center gap-6 text-center">
				<Link
					href="/"
					className="transition-opacity hover:opacity-80"
				>
					<Logo />
				</Link>

				<div className="space-y-2">
					<div className="flex items-center justify-center gap-2">
						<span className="h-px w-8 bg-primary/30" />
						<span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">
							Protocol 03
						</span>
						<span className="h-px w-8 bg-primary/30" />
					</div>
					<h1 className="text-3xl font-serif uppercase italic font-black tracking-tighter">
						Email{" "}
						<span className="not-italic font-light">
							Validation
						</span>
					</h1>
				</div>

				<Controller
					name="token"
					control={control}
					render={({ fieldState }) => (
						<div className="min-h-20 flex items-center justify-center w-full">
							{isSubmitting ? (
								<div className="flex flex-col items-center gap-3">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
									<p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
										Synchronizing...
									</p>
								</div>
							) : isVerified ? (
								<div className="flex flex-col items-center gap-3">
									<ShieldCheck
										className="h-8 w-8"
										strokeWidth={1}
									/>
									<p className="text-[11px] uppercase tracking-widest font-black">
										Verified
									</p>
								</div>
							) : fieldState.invalid ? (
								<div className="flex flex-col items-center gap-3 text-destructive">
									<ShieldAlert
										className="h-8 w-8"
										strokeWidth={1}
									/>
									<Field data-invalid={fieldState.invalid}>
										<FieldError
											errors={[fieldState.error]}
											className="border-none bg-transparent p-0 text-[10px] uppercase font-bold"
										/>
									</Field>
								</div>
							) : (
								<p className="text-[10px] uppercase tracking-widest text-muted-foreground">
									Awaiting Pulse...
								</p>
							)}
						</div>
					)}
				/>
			</div>

			<Controller
				name="token"
				control={control}
				render={({ field, fieldState }) => (
					<Field
						data-invalid={fieldState.invalid}
						className="hidden"
					>
						<Input
							{...field}
							type="hidden"
						/>
					</Field>
				)}
			/>

			<Button
				type="button"
				variant={isVerified ? "default" : "outline"}
				onClick={() =>
					router.push(isVerified ? "/dashboard" : "/auth/login")
				}
				className="w-full h-12 rounded-none uppercase text-[11px] tracking-[0.3em] font-bold"
			>
				{isVerified ? "Enter Archive" : "Return to Portal"}
			</Button>
		</form>
	)
}

export default function VerifyEmailPage() {
	return (
		<main className="min-h-screen flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-95 space-y-12">
				<Suspense
					fallback={
						<Loader2 className="h-6 w-6 animate-spin mx-auto" />
					}
				>
					<VerifyEmailContent />
				</Suspense>
				<Separator className="bg-border/40" />
				<AuthFormFooter />
			</div>
		</main>
	)
}
