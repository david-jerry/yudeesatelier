"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import {
	IconEye,
	IconEyeOff,
	IconLoader2,
	IconArrowRight,
	IconMailOpened,
	IconRefresh,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { config } from "@/config"
import { authClient } from "@/lib/authClient"
import { checkEmailExists } from "@/actions/auth"
import { SignupFormData, signupSchema } from "../zodSchemas/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Logo from "@/components/common/Logo"
import AuthFormFooter from "../_component/AuthFormFooter"

export function SignupForm({ className }: { className?: string }) {
	const [isPending, startTransition] = React.useTransition()
	const [showPassword, setShowPassword] = React.useState(false)
	const [revealPassword, setRevealPassword] = React.useState(false)
	const [isSubmitted, setIsSubmitted] = React.useState(false)
	const router = useRouter()

	const {
		register,
		handleSubmit,
		setFocus,
		trigger,
		getValues,
		formState: { errors, isSubmitting },
	} = useForm<SignupFormData>({
		// @ts-expect-error - zodResolver types are not correctly inferring the schema shape here, but we know it works at runtime. We'll need to revisit this for better type safety in the future.
		resolver: zodResolver(signupSchema),
		defaultValues: { name: "", email: "", password: "" },
		mode: "onTouched",
	})

	const isLoading = isPending || isSubmitting

	const onEmailStep = async () => {
		const emailValid = await trigger("email")
		if (!emailValid) return

		const { email } = getValues()

		startTransition(async () => {
			try {
				const res = await checkEmailExists({ email })
				if (res.success && res.data) {
					toast.info("Welcome Back", {
						description:
							"This email is already registered. Redirecting to login...",
					})
					router.push("/auth/login")
				} else {
					setShowPassword(true)
					setTimeout(() => setFocus("name"), 100)
				}
			} catch (err) {
				console.error("Email verification step failed", { err })
				toast.error("Something went wrong. Please try again.")
			}
		})
	}

	const handleSignup: SubmitHandler<SignupFormData> = async (data) => {
		await authClient.signUp.email(
			{
				name: data.name,
				email: data.email,
				password: data.password,
				callbackURL: `${config.BASE_URL}/auth/login`,
			},
			{
				onSuccess: () => {
					toast.success("Atelier Account Created")
					setIsSubmitted(true)
				},
				onError: (ctx) => {
					toast.error(ctx.error.message || "Registration failed")
				},
			},
		)
	}

	const handleResend = React.useCallback(async () => {
		const { email } = getValues()
		if (!email) return

		startTransition(async () => {
			try {
				await authClient.sendVerificationEmail(
					{
						email: email,
						callbackURL: `${config.BASE_URL}/dashboard`,
					},
					{
						onSuccess: () => {
							toast.success("New Link Sent", {
								description: `Verification email resent to ${email}`,
							})
						},
						onError: (ctx) => {
							toast.error(ctx.error.message || "Resend failed")
						},
					},
				)
			} catch (err) {
				toast.error("Failed to resend email.")
			}
		})
	}, [getValues])

	return (
		<div
			className={cn("grid gap-8 w-full max-w-100 mx-auto", className)}
		>
			<AnimatePresence mode="wait">
				{!isSubmitted ? (
					<motion.div
						key="signup-form"
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 10 }}
						className="grid gap-8"
					>
						<div className="flex flex-col items-center gap-4 text-center">
							<Logo />
							<div className="space-y-2">
								<h1 className="text-2xl font-serif tracking-tight text-foreground">
									Create an Account
								</h1>
								<p className="text-sm text-muted-foreground font-light italic">
									Join the Atelier community for a curated
									experience.
								</p>
							</div>
						</div>

						<form
							onSubmit={
								showPassword
									? handleSubmit(handleSignup)
									: (e) => e.preventDefault()
							}
							className="grid gap-5"
						>
							<div className="space-y-2">
								<Label
									htmlFor="email"
									className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/70"
								>
									Email Address
								</Label>
								<Input
									{...register("email")}
									id="email"
									placeholder="artisan@example.com"
									className="rounded-none border-t-0 border-x-0 border-b bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary transition-all"
									readOnly={showPassword}
									disabled={isLoading}
								/>
								{errors.email && (
									<p className="text-[10px] uppercase text-destructive font-semibold tracking-wider pt-1">
										{errors.email.message}
									</p>
								)}
							</div>

							<AnimatePresence mode="wait">
								{showPassword && (
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										className="grid gap-5"
									>
										<div className="space-y-2">
											<Label
												htmlFor="name"
												className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/70"
											>
												Full Name
											</Label>
											<Input
												{...register("name")}
												id="name"
												placeholder="John Doe"
												className="rounded-none border-t-0 border-x-0 border-b bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary"
												disabled={isLoading}
											/>
											{errors.name && (
												<p className="text-[10px] uppercase text-destructive font-semibold tracking-wider pt-1">
													{errors.name.message}
												</p>
											)}
										</div>

										<div className="space-y-2">
											<Label
												htmlFor="password"
												className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/70"
											>
												Secure Password
											</Label>
											<div className="relative">
												<Input
													{...register("password")}
													id="password"
													type={
														revealPassword
															? "text"
															: "password"
													}
													className="rounded-none border-t-0 border-x-0 border-b bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary pr-10"
													disabled={isLoading}
												/>
												<button
													type="button"
													onClick={() =>
														setRevealPassword(
															!revealPassword,
														)
													}
													className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
												>
													{revealPassword ? (
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
									</motion.div>
								)}
							</AnimatePresence>

							<Button
								type="button"
								onClick={
									showPassword
										? handleSubmit(handleSignup)
										: onEmailStep
								}
								disabled={isLoading}
								className="w-full rounded-none h-12 uppercase tracking-[0.2em] text-[11px] group transition-all hover:tracking-[0.3em]"
							>
								{isLoading ? (
									<IconLoader2
										className="animate-spin"
										size={18}
									/>
								) : (
									<span className="flex items-center gap-2">
										{showPassword
											? "Complete Registration"
											: "Continue"}
										{!showPassword && (
											<IconArrowRight
												size={16}
												className="group-hover:translate-x-1 transition-transform"
											/>
										)}
									</span>
								)}
							</Button>
						</form>
						<div className="space-y-4">
							<AuthFormFooter />
							<p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
								Already an Artisan?{" "}
								<Link
									href="/auth/login"
									className="text-primary hover:italic transition-all underline underline-offset-4"
								>
									Sign In
								</Link>
							</p>
						</div>
					</motion.div>
				) : (
					<motion.div
						key="success-state"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="flex flex-col items-center text-center gap-6 py-4"
					>
						<div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-2">
							<IconMailOpened
								size={40}
								stroke={1}
								className="text-primary animate-pulse"
							/>
						</div>
						<div className="space-y-2">
							<h1 className="text-2xl font-serif tracking-tight">
								Confirm Your Identity
							</h1>
							<p className="text-sm text-muted-foreground font-light leading-relaxed">
								We&apos;ve sent a verification link to{" "}
								<span className="font-medium text-foreground italic">
									{getValues("email")}
								</span>
								. Please check your inbox to finalize your
								membership.
							</p>
						</div>

						<div className="grid gap-3 w-full mt-4">
							<Button
								variant="outline"
								onClick={handleResend}
								disabled={isPending}
								className="rounded-none uppercase tracking-[0.2em] text-[10px] h-11 border-primary/20 hover:bg-primary/5 transition-all"
							>
								{isPending ? (
									<IconLoader2
										className="animate-spin mr-2"
										size={14}
									/>
								) : (
									<IconRefresh
										size={14}
										className="mr-2"
									/>
								)}
								Resend Email
							</Button>
							<Link
								href="/auth/login"
								className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors py-2"
							>
								Back to Sign In
							</Link>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
