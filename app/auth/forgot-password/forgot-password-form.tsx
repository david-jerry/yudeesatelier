"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { IconLoader2, IconArrowLeft } from "@tabler/icons-react"

import { config } from "@/config"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/authClient"
import { EmailFormData, emailSchema } from "../zodSchemas/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Logo from "@/components/common/Logo"
import AuthFormFooter from "../_component/AuthFormFooter"

export function ForgotPasswordForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [isPending, startTransition] = React.useTransition()
	const [error, setError] = React.useState<string | null>(null)
	const router = useRouter()

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<EmailFormData>({
		resolver: zodResolver(emailSchema),
		defaultValues: { email: "" },
		mode: "onTouched",
	})

	const handleSubmitForm = React.useCallback(
		async (data: EmailFormData) => {
			setError(null)

			startTransition(async () => {
				try {
					await authClient.requestPasswordReset(
						{
							email: data.email,
							redirectTo: `${config.BASE_URL}/auth/reset-password`,
						},
						{
							async onSuccess() {
								toast.success("Reset Instructions Sent", {
									description: `We've sent a recovery link to ${data.email}.`,
								})
								router.push("/auth/login")
								reset()
							},
							onError(context) {
								const message =
									context.error.message ||
									"Failed to send reset token."
								toast.error("Reset Error", {
									description: message,
								})
								setError(message)
							},
						},
					)
				} catch (err) {
					setError("Reset failed. Please try again.")
					console.error("Reset error:", err)
				}
			})
		},
		[router, reset],
	)

	return (
		<div
			className={cn("grid gap-8 w-full max-w-100 mx-auto", className)}
			{...props}
		>
			<div className="flex flex-col items-center gap-4 text-center">
				<Logo />
				<div className="space-y-2">
					<h1 className="text-2xl font-serif tracking-tight text-foreground">
						Recover Access
					</h1>
					<p className="text-sm text-muted-foreground font-light italic px-4">
						Enter your email and we&apos;ll send you the keys to get
						back in.
					</p>
				</div>
			</div>

			<form
				onSubmit={handleSubmit(handleSubmitForm)}
				className="grid gap-6"
			>
				{error && (
					<div className="bg-destructive/10 border border-destructive/20 py-2 px-3 rounded-none">
						<p className="text-[10px] uppercase tracking-wider text-destructive text-center font-bold">
							{error}
						</p>
					</div>
				)}

				<div className="space-y-2">
					<Label
						htmlFor="email"
						className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/70"
					>
						Registered Email
					</Label>
					<Input
						{...register("email")}
						id="email"
						type="email"
						placeholder="artisan@example.com"
						autoFocus
						disabled={isPending}
						className="rounded-none border-t-0 border-x-0 border-b bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary transition-all placeholder:text-muted-foreground/30"
					/>
					{errors.email && (
						<p className="text-[10px] uppercase text-destructive font-semibold tracking-wider pt-1">
							{errors.email.message}
						</p>
					)}
				</div>

				<Button
					type="submit"
					disabled={isPending}
					className="w-full rounded-none h-12 uppercase tracking-[0.2em] text-[11px] mt-2 transition-all hover:tracking-[0.3em]"
				>
					{isPending ? (
						<IconLoader2
							className="animate-spin"
							size={18}
						/>
					) : (
						"Send Recovery Link"
					)}
				</Button>

				<div className="flex justify-center pt-2">
					<Link
						href="/auth/login"
						className="group flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
					>
						<IconArrowLeft
							size={14}
							className="group-hover:-translate-x-1 transition-transform"
						/>
						Back to Sign In
					</Link>
				</div>
			</form>

			<AuthFormFooter className="mt-4" />
		</div>
	)
}
