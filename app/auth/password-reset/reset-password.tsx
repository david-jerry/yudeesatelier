"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
	IconLoader2,
	IconEye,
	IconEyeOff,
	IconArrowLeft,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { authClient } from "@/lib/authClient"
import { PasswordFormData, passwordSchema } from "../zodSchemas/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Logo from "@/components/common/Logo"
import AuthFormFooter from "../_component/AuthFormFooter"

export function ResetPasswordForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [isPending, startTransition] = React.useTransition()
	const [showPassword, setShowPassword] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)
	const router = useRouter()

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<PasswordFormData>({
		// @ts-expect-error - zodResolver types are not correctly inferring the schema shape here, but we know it works at runtime. We'll need to revisit this for better type safety in the future.
		resolver: zodResolver(passwordSchema),
		defaultValues: { password: "" },
		mode: "onTouched",
	})

	const handleSubmitForm: SubmitHandler<PasswordFormData> = React.useCallback(
		async (data) => {
			setError(null)

			startTransition(async () => {
				try {
					const token = new URLSearchParams(
						window.location.search,
					).get("token")

					if (!token) {
						setError(
							"Missing reset token. Please request a new link.",
						)
						return
					}

					await authClient.resetPassword(
						{
							newPassword: data.password,
							token,
						},
						{
							async onSuccess() {
								toast.success("Password Updated", {
									description:
										"Your security credentials have been successfully reset.",
								})
								router.push("/auth/login")
								reset()
							},
							onError(context) {
								const msg =
									context.error.message ||
									"Failed to reset your password."
								toast.error("Update Failed", {
									description: msg,
								})
								setError(msg)
							},
						},
					)
				} catch (err) {
					setError("An unexpected error occurred.")
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
						Secure Your Account
					</h1>
					<p className="text-sm text-muted-foreground font-light italic px-4">
						Define a new password to regain access to your atelier.
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
						htmlFor="password"
						className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/70"
					>
						New Password
					</Label>
					<div className="relative">
						<Input
							{...register("password")}
							id="password"
							type={showPassword ? "text" : "password"}
							placeholder="••••••••"
							disabled={isPending}
							className="rounded-none border-t-0 border-x-0 border-b bg-transparent px-0 pr-10 focus-visible:ring-0 focus-visible:border-primary transition-all placeholder:text-muted-foreground/30"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
						>
							{showPassword ? (
								<IconEyeOff size={16} />
							) : (
								<IconEye size={16} />
							)}
						</button>
					</div>
					{errors.password && (
						<p className="text-[10px] uppercase text-destructive font-semibold tracking-wider pt-1">
							{errors.password.message}
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
						"Update Password"
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
						Cancel and return
					</Link>
				</div>
			</form>

			<AuthFormFooter className="mt-4" />
		</div>
	)
}
