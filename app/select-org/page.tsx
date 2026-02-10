"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

/**
 * This page now just redirects to the dashboard.
 * In single-org mode, users are automatically assigned to the default organization,
 * so there's no need to select or create organizations.
 */
export default function SelectOrgPage() {
    const { data: session, isPending: isSessionPending } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isSessionPending) {
            if (session) {
                // User is authenticated, redirect to dashboard
                router.replace("/dashboard");
            } else {
                // User is not authenticated, redirect to sign-in
                router.replace("/sign-in");
            }
        }
    }, [session, isSessionPending, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
                <p className="mt-4 text-gray-600">Redirecting...</p>
            </div>
        </div>
    );
}
