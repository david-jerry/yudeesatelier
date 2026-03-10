"use client"

import { ReactNode, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/hooks/useZustand"
import type { User } from "@/db/models/user"
import { authClient } from "@/lib/authClient"
import { toast } from "sonner"

interface AuthProviderProps {
	children: ReactNode
	initialUser: User | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
	const { setUser, isInitialized, setInitialized } = useAuthStore()

	/**
	 * useMemo handles the synchronous sync from Server -> Client Store.
	 * This runs during the render cycle, ensuring no "empty store" frames.
	 */
	useMemo(() => {
		try {
			// We only sync if the store isn't already initialized to avoid redundant writes
			if (typeof window !== "undefined") {
				if (initialUser?.isBanned) {
					authClient.signOut() // Immediate sign-out if user is banned
					toast.info("Your account has been banned. Logging out.")
				}
				setInitialized(true)
				setUser(
					initialUser
						? {
								...initialUser,
								image: initialUser.image ?? null,
                                imagePublicId: initialUser.imagePublicId ?? null,
								subscribed: initialUser.subscribed ?? null,
                                isAdmin: initialUser.isAdmin ?? null,
                                isStaff: initialUser.isStaff ?? null,
							}
						: null,
				)
			}
		} catch (error) {
			// Using console.error for logging
			console.error("Critical Auth Sync Error during useMemo:", { error })
		}
		// Dependencies are stable: setUser and setInitialized are memoized by Zustand
	}, [initialUser, setUser, setInitialized])

	// 2. Loading State (Only if sync fails or is delayed)
	if (!isInitialized) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-10 w-10 animate-spin text-primary" />
					<p className="text-sm text-muted-foreground animate-pulse">
						Authenticating...
					</p>
				</div>
			</div>
		)
	}

	return <>{children}</>
}
