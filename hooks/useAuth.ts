"use client"

import { updateUserBanStatus, updateUserStaffStatus } from "@/actions/auth"
import { useAuthStore } from "@/hooks/useZustand"
import { authClient } from "@/lib/authClient"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useMemo, useCallback } from "react"
import { toast } from "sonner"

interface ProfileUpdateValues {
    name?: string;
    image?: string;
    imagePublicId?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
    subscribed?: boolean;
    isBanned?: boolean;
}

export const useAuth = () => {
    const router = useRouter()
    const queryClient = useQueryClient()
    const {
        user,
        isAuthenticated,
        isInitialized,
        isBanned,
        logout: clearStore,
        setUser,
    } = useAuthStore()

    /**
     * handleLogout
     * Wrapped in useCallback to prevent unnecessary re-renders in client components
     */
    const handleLogout = useCallback(async () => {
        console.info("Initiating user logout sequence")

        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    console.info("Logout successful, clearing local store")
                    clearStore()
                    router.push("/")
                    toast.success("Logged out successfully")
                },
                onError: (ctx) => {
                    console.error("Logout failed", { error: ctx.error.message })
                    toast.error("Failed to log out")
                }
            },
        })
    }, [clearStore, router])

    /**
     * updateProfile
     * Syncs Better-Auth with Zustand and handles UI feedback
     */
    const updateProfile = useCallback(async (values: ProfileUpdateValues) => {
        console.info("Updating user profile", { userId: user?.id })

        await authClient.updateUser({
            name: values.name,
            image: values.image,
            imagePublicId: values.imagePublicId,
            // Fallback to existing user state if values are undefined
            isAdmin: values.isAdmin ?? user?.isAdmin,
            isStaff: values.isStaff ?? user?.isStaff,
            subscribed: values.subscribed ?? user?.subscribed,
            isBanned: values.isBanned ?? user?.isBanned,
            fetchOptions: {
                onSuccess: async ({ data }) => {
                    // Sync Zustand store using the action
                    setUser(data);
                    console.info("Zustand store synced after profile update")

                    toast.success("Profile updated successfully")
                    router.refresh()
                },
                onError: (ctx) => {
                    console.error("Profile update failed", { error: ctx.error.message })
                    toast.error(ctx.error.message || "Failed to update profile")
                }
            },
        });
    }, [user, setUser, router])

    /**
     * toggleStaffStatus
     * Admin Action: Uses server action with Redis locking to promote/demote staff
     */
    const toggleStaffStatus = useCallback(async (targetUserId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        const res = await updateUserStaffStatus(targetUserId, newStatus);

        if (res.success && res.data) {
            toast.success(res.message);
            // Invalidate the cache to refresh the User Registry table
            queryClient.invalidateQueries({ queryKey: ["admin_users"] });
            router.refresh() // Refresh to trigger client-side role logic (e.g., access changes)
        } else {
            toast.error(res.message || "Failed to update staff status");
        }
    }, [queryClient]);

    /**
     * toggleBanStatus
     * Admin Action: Uses server action with Redis locking to ban/unban
     */
    const toggleBanStatus = useCallback(async (targetUserId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        const res = await updateUserBanStatus(targetUserId, newStatus);

        if (res.success && res.data) {
            toast.success(res.message);
            queryClient.invalidateQueries({ queryKey: ["admin_users"] });
            router.refresh() // Refresh to trigger client-side ban logic (e.g., auto-logout)
        } else {
            toast.error(res.message || "Failed to update ban status");
        }
    }, [queryClient]);

    /**
     * revokeSession
     * Terminates a specific session via token
     */
    const revokeSession = useCallback(async (token: string) => {
        await authClient.revokeSession({
            token,
            fetchOptions: {
                onSuccess: () => {
                    toast.success("Session terminated")
                    // Invalidate the admin users list to reflect the change
                    queryClient.invalidateQueries({ queryKey: ["admin_users"] })
                },
                onError: (ctx) => {
                    toast.error(ctx.error.message || "Failed to revoke session")
                }
            }
        })
    }, [queryClient])

    /**
     * roleStats
     * Derived RBAC States for the Yudees Atelier dashboard
    */
    const roleStats = useMemo(() => {
        return {
            isSuperUser: !!(user?.isAdmin && user?.isStaff),
            isAdmin: !!user?.isAdmin,
            isStaff: !!user?.isStaff,
        }
    }, [user?.isAdmin, user?.isStaff])

    return {
        // State
        user,
        isAuthenticated,
        isInitialized,
        isBanned,
        ...roleStats,
        setUser,
        toggleStaffStatus,
        toggleBanStatus,
        logout: handleLogout,
        revokeSession,
        updateProfile
    }
}