"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
	IconEye,
	IconEyeOff,
	IconLoader2,
	IconBrandGoogle,
	IconBrandLinkedin,
	IconFingerprint,
	IconArrowRight,
	IconBrandLinkedinFilled,
	IconBrandGoogleFilled,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { config } from "@/config"
import { authClient } from "@/lib/authClient"
import { checkEmailExists } from "@/actions/auth"
import { LoginFormData, loginSchema } from "../zodSchemas/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Logo from "@/components/common/Logo"
import AuthFormFooter from "../_component/AuthFormFooter"

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const { refetch } = authClient.useSession()
	const [isPending, startTransition] = React.useTransition()
	const [showPassword, setShowPassword] = React.useState(false)
	const [revealPassword, setRevealPassword] = React.useState(false)
	const router = useRouter()

	const {
		control,
		handleSubmit,
		setValue,
		setFocus,
		trigger,
		getValues,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormData>({
		// @ts-expect-error - Zod schema is compatible with RHF
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
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
				if (res.success && !res.data) {
					toast.info("Account Not Found", {
						description: "Join the atelier to start benefiting.",
					})
					router.push("/auth/signup")
				} else {
					setShowPassword(true)
					setTimeout(() => setFocus("password"), 100)
				}
			} catch (err) {
				toast.error("Login email check failed", { description: err instanceof Error ? err.message : "An unknown error occurred" })
			}
		})
	}

	const handleLogin = async (data: LoginFormData) => {
		await authClient.signIn.email(
			{
				email: data.email,
				password: data.password,
				callbackURL: `${config.BASE_URL}/dashboard`,
			},
			{
				onSuccess: () => {
					refetch()
					toast.success("Welcome back to the Atelier")
					router.push("/dashboard")
				},
				onError: (ctx) => {
					toast.error(ctx.error.message || "Authentication failed")
				},
			},
		)
	}

	const handleSocialAuth = (provider: "google" | "linkedin") => {
		authClient.signIn.social({
			provider,
			callbackURL: `${config.BASE_URL}/dashboard`,
		})
	}

	return (
		<div
			className={cn("grid gap-8 w-full max-w-100 mx-auto", className)}
			{...props}
		>
			<div className="flex flex-col items-center gap-4 text-center">
				<Logo />
				<div className="space-y-2">
					<h1 className="text-2xl font-serif tracking-tight">
						Sign In
					</h1>
					<p className="text-sm text-muted-foreground font-light italic">
						Access your curated workspace.
					</p>
				</div>
			</div>

			<form
				onSubmit={
					showPassword
						? handleSubmit(handleLogin)
						: (e) => e.preventDefault()
				}
				className="grid gap-6"
			>
				<div className="space-y-2">
					<Label
						htmlFor="email"
						className="text-[10px] uppercase tracking-[0.2em] font-bold"
					>
						Email Address
					</Label>
					<Controller
						control={control}
						name="email"
						render={({ field }) => (
							<Input
								{...field}
								id="email"
								type="email"
								placeholder="artisan@yudees.com"
								className="rounded-none border-t-0 border-x-0 border-b bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary transition-all"
								readOnly={showPassword}
								disabled={isLoading}
							/>
						)}
					/>
				</div>

				<AnimatePresence>
					{showPassword && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="space-y-4 overflow-hidden"
						>
							<div className="space-y-2">
								<div className="flex justify-between items-end">
									<Label
										htmlFor="password"
										className="text-[10px] uppercase tracking-[0.2em] font-bold"
									>
										Password
									</Label>
									<Link
										href="/auth/forgot-password"
										className="text-[10px] uppercase text-muted-foreground hover:text-primary transition-colors"
									>
										Forgot?
									</Link>
								</div>
								<div className="relative">
									<Controller
										control={control}
										name="password"
										render={({ field }) => (
											<Input
												{...field}
												id="password"
												type={
													revealPassword
														? "text"
														: "password"
												}
												className="rounded-none border-t-0 border-x-0 border-b bg-transparent px-0 focus-visible:ring-0 focus-visible:border-primary pr-10"
												disabled={isLoading}
											/>
										)}
									/>
									<button
										type="button"
										onClick={() =>
											setRevealPassword(!revealPassword)
										}
										className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
									>
										{revealPassword ? (
											<IconEyeOff
												size={16}
												stroke={2.5}
											/>
										) : (
											<IconEye
												size={16}
												stroke={2.5}
											/>
										)}
									</button>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<Button
					type={showPassword ? "submit" : "button"}
					onClick={
						showPassword ? handleSubmit(handleLogin) : onEmailStep
					}
					disabled={isLoading}
					className="w-full rounded-none h-12 uppercase tracking-[0.2em] text-[11px]"
				>
					{isLoading ? (
						<IconLoader2
							className="animate-spin"
							size={18}
						/>
					) : showPassword ? (
						"Sign In"
					) : (
						"Continue"
					)}
				</Button>

				<div className="relative py-2">
					<div className="absolute inset-0 flex items-center">
						<Separator />
					</div>
					<div className="relative flex justify-center text-[10px] uppercase tracking-widest bg-background px-2 text-muted-foreground">
						Or Social Access
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<Button
						variant="outline"
						className="rounded-none border-muted h-11 text-[10px] uppercase tracking-wider py-2"
						onClick={() => handleSocialAuth("linkedin")}
					>
						<IconBrandLinkedinFilled
							size={18}
							className="text-[#0077B5]"
						/>{" "}
						LinkedIn
					</Button>
					<Button
						variant="outline"
						className="rounded-none border-muted h-11 text-[10px] uppercase tracking-wider py-2"
						onClick={() => handleSocialAuth("google")}
					>
						<IconBrandGoogleFilled
							size={18}
							className="text-[#DB4437]"
						/>{" "}
						Google
					</Button>
				</div>

				<Button
					variant="ghost"
					className="rounded-none text-[10px] uppercase tracking-widest font-light"
					onClick={() => authClient.signIn.passkey()}
				>
					<IconFingerprint
						size={18}
						className="mr-2 stroke-[1.2]"
					/>{" "}
					Biometric Sign In
				</Button>
			</form>

			<div className="space-y-4">
				<AuthFormFooter />
				<p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest">
					New to the Atelier?{" "}
					<Link
						href="/auth/signup"
						className="text-primary hover:underline"
					>
						Create Account
					</Link>
				</p>
			</div>
		</div>
	)
}
