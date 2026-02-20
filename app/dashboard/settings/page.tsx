"use client";

import { useActiveOrganization, useActiveMember } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
    ShieldCheck,
    Plus,
    Loader2,
    DollarSign,
    UserCircle,
    AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader, LoadingSpinner, ConfirmDeleteButton } from "@/components/ui";

interface ApprovalRule {
    id: string;
    minAmount: number;
    currency: string;
    role: string;
    createdAt: string;
}

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED", "JPY", "CNY"] as const;

export default function SettingsPage() {
    const { data: activeOrg } = useActiveOrganization();
    const { data: activeMember, isPending: isMemberLoading } = useActiveMember();
    const queryClient = useQueryClient();

    const [minAmount, setMinAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [role, setRole] = useState("APPROVER");
    const [isCreating, setIsCreating] = useState(false);

    const { data: rules = [], isLoading } = useQuery({
        queryKey: ["approval-rules", activeOrg?.id],
        queryFn: () => api.get<ApprovalRule[]>(`/approvals/rules/${activeOrg?.id}`),
        enabled: !!activeOrg?.id,
    });

    const createMutation = useMutation({
        mutationFn: (newRule: { minAmount: number; currency: string; role: string }) =>
            api.post("/approvals/rules", { ...newRule, organizationId: activeOrg?.id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["approval-rules"] });
            setMinAmount("");
            setCurrency("USD");
            setIsCreating(false);
        },
        onError: (err: any) => alert(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/approvals/rules/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["approval-rules"] });
        },
        onError: (err: any) => alert(err.message),
    });

    const userRole = activeMember?.role?.toLowerCase();

    if (isMemberLoading) {
        return <LoadingSpinner fullScreen />;
    }

    if (userRole !== "owner" && userRole !== "org_owner") {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
                <p className="text-gray-600 mt-2">Only organization owners can manage approval rules.</p>
            </div>
        );
    }

    return (
        <div className="p-8 text-gray-900">
            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Rule Management"
                    subtitle="Define thresholds for Purchase Order approvals."
                    icon={ShieldCheck}
                    action={
                        <button
                            onClick={() => setIsCreating(!isCreating)}
                            className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCreating ? "bg-gray-100 text-gray-600" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                        >
                            <Plus className={`h-4 w-4 transition-transform ${isCreating ? "rotate-45" : ""}`} />
                            {isCreating ? "Cancel" : "Add Rule"}
                        </button>
                    }
                />

                {isCreating && (
                    <div className="bg-white rounded-2xl shadow-sm border p-6 animate-in slide-in-from-top-4 duration-200">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                createMutation.mutate({ minAmount: parseFloat(minAmount), currency, role });
                            }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end"
                        >
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Threshold Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="number"
                                        required
                                        placeholder="1000"
                                        value={minAmount}
                                        onChange={(e) => setMinAmount(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Currency</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none cursor-pointer"
                                >
                                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Required Role</label>
                                <div className="relative">
                                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="APPROVER">Approver</option>
                                        <option value="OWNER">Owner</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={createMutation.isPending}
                                className="bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                            >
                                {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Rule"}
                            </button>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Active Rules</h3>
                    </div>
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : rules.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 italic">No rules defined yet. Large orders will be auto-approved.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {rules.map((rule) => (
                                <div key={rule.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-bold">Orders exceeding {rule.currency} {rule.minAmount.toLocaleString()}</p>
                                            <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                                <UserCircle className="h-3.5 w-3.5 text-gray-400" />
                                                Require approval from: <span className="font-bold text-indigo-600">{rule.role}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <ConfirmDeleteButton
                                        onDelete={() => deleteMutation.mutate(rule.id)}
                                        isDeleting={deleteMutation.isPending && deleteMutation.variables === rule.id}
                                        confirmMessage="Delete this rule?"
                                        title="Delete Rule"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
