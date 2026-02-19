"use client";

import { useActiveOrganization, useSession, useActiveMember } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import {
    ShieldCheck,
    Plus,
    Loader2,
    DollarSign,
    UserCircle,
    Trash2,
    AlertCircle
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface ApprovalRule {
    id: string;
    minAmount: number;
    role: string;
    createdAt: string;
}

export default function SettingsPage() {
    const { data: session } = useSession();
    const { data: activeOrg } = useActiveOrganization();
    const { data: activeMember, isPending: isMemberLoading } = useActiveMember();
    const [rules, setRules] = useState<ApprovalRule[]>([]);
    const [loading, setLoading] = useState(false);

    // New Rule State
    const [minAmount, setMinAmount] = useState("");
    const [role, setRole] = useState("APPROVER");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (activeOrg) {
            fetchRules();
        }
    }, [activeOrg]);

    const fetchRules = async () => {
        if (!activeOrg) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/approvals/rules/${activeOrg.id}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const result = await res.json();
                setRules(result.data || result);
            }
        } catch (err) {
            console.error("Failed to fetch rules", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOrg) return;

        try {
            const res = await fetch(`${API_BASE}/approvals/rules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    minAmount: parseFloat(minAmount),
                    role: role
                })
            });

            if (res.ok) {
                await fetchRules();
                setMinAmount("");
                setIsCreating(false);
            } else {
                alert("Failed to create rule");
            }
        } catch (err) {
            console.error(err);
            alert("Error creating rule");
        }
    };

    const userRole = activeMember?.role?.toLowerCase();

    if (isMemberLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (userRole !== 'owner' && userRole !== 'org_owner') {
        console.log("Active Member:", activeMember);
        console.log("Active Org:", activeOrg);
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
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <ShieldCheck className="h-8 w-8 text-indigo-600" />
                            Rule Management
                        </h1>
                        <p className="text-gray-600 mt-1">Define thresholds for Purchase Order approvals.</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCreating ? 'bg-gray-100 text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        <Plus className={`h-4 w-4 transition-transform ${isCreating ? 'rotate-45' : ''}`} />
                        {isCreating ? 'Cancel' : 'Add Rule'}
                    </button>
                </div>

                {/* Create Rule Form */}
                {isCreating && (
                    <div className="bg-white rounded-2xl shadow-sm border p-6 animate-in slide-in-from-top-4 duration-200">
                        <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Threshold Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="number"
                                        required
                                        placeholder="1000"
                                        value={minAmount}
                                        onChange={e => setMinAmount(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Required Role</label>
                                <div className="relative">
                                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <select
                                        value={role}
                                        onChange={e => setRole(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="APPROVER">Approver</option>
                                        <option value="OWNER">Owner</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                                Create Rule
                            </button>
                        </form>
                    </div>
                )}

                {/* Rules List */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Active Rules</h3>
                    </div>
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
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
                                            <p className="text-gray-900 font-bold">Orders exceeding ${rule.minAmount.toLocaleString()}</p>
                                            <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                                <UserCircle className="h-3.5 w-3.5 text-gray-400" />
                                                Require approval from: <span className="font-bold text-indigo-600">{rule.role}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>



            </div>
        </div>
    );
}
