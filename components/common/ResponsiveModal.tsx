/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Dispatch, SetStateAction } from "react"

interface ResponsiveModalProps {
	open: boolean
	onOpenChange: Dispatch<SetStateAction<boolean>>
	trigger?: React.ReactNode
	title: string
	description?: string
	children: React.ReactNode
	footer?: React.ReactNode
	formResolver?: any
	className?: string
	size?: "sm" | "md" | "lg" | "xl"
}

export function ResponsiveModal({
	open,
	onOpenChange,
	trigger,
	title,
	description,
	children,
	footer,
	className,
	formResolver,
	size = "md",
}: ResponsiveModalProps) {
	const isMobile = useIsMobile()

	const sizeClasses = {
		sm: "max-w-sm!",
		md: "max-w-md!",
		lg: "max-w-lg!",
		xl: "max-w-xl!",
	}

	if (!isMobile) {
		return (
			<>
				<Dialog
					open={open}
					onOpenChange={() => {
						if (formResolver) formResolver.reset()
						onOpenChange(!open)
					}}
				>
					{trigger && (
						<DialogTrigger asChild>{trigger}</DialogTrigger>
					)}
					<DialogContent
						className={cn(
							`max-h-[80vh] overflow-y-auto ${sizeClasses[size]}`,
							className
						)}
					>
						<DialogHeader>
							<DialogTitle>{title}</DialogTitle>
							{description && (
								<DialogDescription>
									{description}
								</DialogDescription>
							)}
						</DialogHeader>
						<div className="flex flex-col space-y-4 relative w-full!">
							{children}
						</div>
						{footer && <DialogFooter>{footer}</DialogFooter>}
					</DialogContent>
				</Dialog>
			</>
		)
	}

	if (isMobile) {
		return (
			<Drawer
				open={open}
				onOpenChange={onOpenChange}
			>
				{trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
				<DrawerContent className={cn("max-h-[96vh]", className)}>
					<DrawerHeader className="text-left">
						<DrawerTitle>{title}</DrawerTitle>
						{description && (
							<DrawerDescription>{description}</DrawerDescription>
						)}
					</DrawerHeader>
					<div className="px-4 overflow-y-auto flex-1 pb-6 relative w-full">
						{children}
					</div>
					{footer && (
						<DrawerFooter className="pt-4">{footer}</DrawerFooter>
					)}
				</DrawerContent>
			</Drawer>
		)
	}

	return null
}
