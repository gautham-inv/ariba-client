"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { organization, useSession, signIn, signUp, signOut } from "@/lib/auth-client";
import { Loader2, CheckCircle2, XCircle, Building2, UserPlus, ShieldCheck, Lock, Mail } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function AcceptInvitationContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const { data: session, isPending: isSessionPending } = useSession();
    const [status, setStatus] = useState<"loading" | "confirming" | "processing" | "success" | "error" | "missing_id">(id ? "loading" : "missing_id");
    const [invitation, setInvitation] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    useEffect(() => {
        async function fetchInvitationDetails() {
            if (!id) return;
            try {
                const res = await fetch(`${API_BASE}/organization/verify-invitation/${id}`, {
                    credentials: "include"
                });
                if (!res.ok) {
                    const errData = await res.json();
                    setStatus("error");
                    setError(errData.message || "Failed to fetch invitation details");
                    return;
                }

                const data = await res.json();
                setInvitation(data);
                setStatus("confirming");
            } catch (err) {
                setStatus("error");
                setError("An unexpected error occurred while fetching invitation");
            }
        }

        if (id) {
            fetchInvitationDetails();
        }
    }, [id]);

    const handleAcceptWithSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setAuthLoading(true);
        try {
            const { error: signupError } = await signUp.email({
                email: invitation.email,
                password,
                name,
            });

            if (signupError) {
                alert(signupError.message);
                setAuthLoading(false);
                return;
            }

            await finalizeAcceptance();
        } catch (err) {
            console.error("[AcceptInvite] Exception during signup:", err);
            alert("An error occurred during signup. Check console for details.");
            setAuthLoading(false);
        }
    };

    const handleAcceptWithSignin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        const { error: signinError } = await signIn.email({
            email: invitation.email,
            password,
        });

        if (signinError) {
            alert(signinError.message);
            setAuthLoading(false);
            return;
        }

        await finalizeAcceptance();
    };

    const handleDirectAccept = async () => {
        if (!session) return;
        setAuthLoading(true);
        await finalizeAcceptance();
    };

    const finalizeAcceptance = async () => {
        if (!id) return;
        setStatus("processing");
        try {
            const { error: inviteError } = await organization.acceptInvitation({
                invitationId: id,
            });

            if (inviteError) {
                setStatus("error");
                setError(inviteError.message || "Failed to join organization");
                return;
            }

            await organization.setActive({
                organizationId: invitation.orgId
            });

            setStatus("success");
            setTimeout(() => {
                router.push("/dashboard");
            }, 2500);
        } catch (err) {
            setStatus("error");
            setError("Integration error after joining");
        }
    };

    if (status === "missing_id") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-gray-100 text-center">
                    <div className="mx-auto h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-amber-50/50">
                        <XCircle className="h-10 w-10 text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Invalid link</h1>
                    <p className="mt-3 text-gray-600">This invitation link is missing the invitation ID. Please use the link from your email.</p>
                    <Link href="/sign-in" className="mt-6 inline-block text-indigo-600 font-semibold hover:underline">Go to sign in</Link>
                </div>
            </div>
        );
    }

    if (status === "loading" || isSessionPending) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-gray-100">

                {status === "confirming" && invitation && (
                    <div className="text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="rounded-2xl bg-indigo-50 p-4 border border-indigo-100">
                                <Building2 className="h-10 w-10 text-indigo-600" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Join Organization</h1>
                        <p className="mt-3 text-gray-600 mb-6">
                            You're invited to join <span className="font-bold text-gray-900">{invitation.organizationName}</span>
                        </p>

                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left mb-8">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Role</p>
                                    <p className="text-sm font-bold text-gray-800 capitalize">{invitation.role}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <Mail className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Invited Email</p>
                                    <p className="text-sm font-bold text-gray-800">{invitation.email}</p>
                                </div>
                            </div>
                        </div>

                        {session ? (
                            <div className="space-y-4">
                                {session.user.email === invitation.email ? (
                                    <>
                                        <p className="text-sm text-green-600 bg-green-50 py-2 rounded-lg font-medium ring-1 ring-green-200">
                                            Signed in as {session.user.email}
                                        </p>
                                        <button
                                            onClick={handleDirectAccept}
                                            disabled={authLoading}
                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 px-6 py-4 rounded-2xl text-white font-bold hover:bg-indigo-700 transition-all shadow-lg"
                                        >
                                            {authLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Accept & Join"}
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg font-medium ring-1 ring-amber-200">
                                            This invite is for {invitation.email}, but you are signed in as {session.user.email}.
                                        </p>
                                        <button
                                            onClick={() => signOut()}
                                            className="w-full bg-gray-100 px-6 py-4 rounded-2xl text-gray-900 font-bold hover:bg-gray-200 transition-all"
                                        >
                                            Sign Out & Switch Account
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : invitation.existingUser ? (
                            <form onSubmit={handleAcceptWithSignin} className="space-y-4 text-left">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="password"
                                            required
                                            placeholder="Enter your password"
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 px-6 py-4 rounded-2xl text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    {authLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign In & Join"}
                                </button>
                                <p className="text-center text-xs text-gray-500 mt-4">
                                    Welcome back! Enter your password to accept the invitation.
                                </p>
                            </form>
                        ) : (
                            <form onSubmit={handleAcceptWithSignup} className="space-y-4 text-left">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
                                    <div className="relative">
                                        <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="John Doe"
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 ml-1">Create Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={authLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 px-6 py-4 rounded-2xl text-white font-bold hover:bg-indigo-700 transition-all shadow-lg"
                                >
                                    {authLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Create Account & Join"}
                                </button>
                            </form>
                        )}

                        <p className="mt-6 text-xs text-gray-400">
                            By joining, you agree to the organization's policies.
                        </p>
                    </div>
                )}

                {status === "processing" && (
                    <div className="text-center py-8">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600 mb-6" />
                        <h1 className="text-2xl font-bold text-gray-900">Setting up access...</h1>
                        <p className="mt-2 text-gray-600 px-8">Finalizing your membership and configuring permissions.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="text-center py-8">
                        <div className="mx-auto h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50/50">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">You're in!</h1>
                        <p className="mt-3 text-gray-600 px-4">
                            Welcome to the team. Redirecting you to your dashboard...
                        </p>
                    </div>
                )}

                {status === "error" && (
                    <div className="text-center py-4">
                        <div className="mx-auto h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Invitation Error</h1>
                        <p className="mt-3 text-red-500 font-medium bg-red-50 py-2 rounded-lg">{error}</p>
                        <div className="mt-8">
                            <Link
                                href="/dashboard"
                                className="w-full inline-flex items-center justify-center rounded-2xl bg-gray-900 px-6 py-4 text-sm font-bold text-white hover:bg-gray-800 transition-all"
                            >
                                Back to Workspace
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AcceptInvitationPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        }>
            <AcceptInvitationContent />
        </Suspense>
    );
}
