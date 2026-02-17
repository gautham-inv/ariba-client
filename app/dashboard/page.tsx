"use client";

import { useSession, useActiveOrganization, useActiveMember, organization } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import {
    Plus,
    Filter,
    Building2,
    FileText,
    Users,
    PlusCircle,
    ChevronRight,
    Clock,
    Loader2,
    ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

interface RFQShort {
    id: string;
    title: string;
    dueDate: string;
    status: string;
    quotes: any[];
    suppliers: any[];
}

interface Supplier {
    id: string;
    name: string;
    email: string;
    status: string;
}

export default function Dashboard() {
    const { data: session } = useSession();
    const { data: activeOrg, isPending: isActiveOrgPending } = useActiveOrganization();
    const { data: activeMember, isPending: isActiveMemberPending } = useActiveMember();
    const router = useRouter();

    // Local state for dashboard widgets
    const [rfqs, setRfqs] = useState<RFQShort[]>([]);
    const [loadingRfqs, setLoadingRfqs] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);

    // Activity log state
    const [activityItems, setActivityItems] = useState<{ id: string; title: string; message: string; type: string; createdAt: string }[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);

    // Quick Action State
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"procurement" | "approver">("procurement");
    const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

    const activeMemberRole = activeMember?.role || (activeOrg as any)?.membership?.role;
    const role = activeMemberRole?.toLowerCase();
    const isOwner = role === 'owner' || role === 'admin' || role === 'org_owner';
    const isProcurement = role === 'procurement';
    const isApprover = role === 'approver';

    // Owners and Admins also count as Procurement/Approver for dashboard visibility
    const canManageProcurement = isOwner || isProcurement;
    const canManageApprovals = isOwner || isApprover;

    useEffect(() => {
        if (role) console.log("Current Organization Role:", role);
    }, [role]);

    useEffect(() => {
        if (activeOrg) {
            fetchActivity();
            if (canManageProcurement) {
                fetchRFQs();
                fetchSuppliers();
            }
            if (canManageApprovals) {
                fetchApprovalsCount();
            }
        }
    }, [activeOrg, role, canManageProcurement, canManageApprovals]);

    const fetchActivity = async () => {
        setActivityLoading(true);
        try {
            const res = await fetch(`${API_BASE}/organization/notifications`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setActivityItems(data);
            }
        } catch (err) {
            console.error('Failed to fetch activity', err);
        } finally {
            setActivityLoading(false);
        }
    };

    const fetchApprovalsCount = async () => {
        try {
            const res = await fetch(`${API_BASE}/approvals/pending/${activeOrg!.id}`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setPendingApprovalsCount(data.length);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSuppliers = async () => {
        if (!activeOrg) return;
        setLoadingSuppliers(true);
        try {
            const res = await fetch(`${API_BASE}/suppliers/org/${activeOrg.id}`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setSuppliers(data);
            }
        } catch (err) {
            console.error("Failed to fetch suppliers", err);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const fetchRFQs = async () => {
        if (!activeOrg) return;
        setLoadingRfqs(true);
        try {
            const res = await fetch(`${API_BASE}/rfq/org/${activeOrg.id}`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setRfqs(data);
            }
        } catch (err) {
            console.error("Failed to fetch RFQs", err);
        } finally {
            setLoadingRfqs(false);
        }
    };

    const handleInviteMember = async () => {
        if (!activeOrg) return;
        await organization.inviteMember({
            email: inviteEmail,
            role: inviteRole as any,
        }, {
            onSuccess: () => {
                alert("Invitation sent!");
                setInviteEmail("");
                setInviteRole("procurement");
            },
            onError: (ctx) => alert(ctx.error.message),
        });
    };

    if (isActiveOrgPending) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!session || !activeOrg || isActiveMemberPending) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Welcome / Stats Banner */}
                <div className="bg-white rounded-2xl shadow-sm border p-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}!</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider border border-indigo-100">
                                {role || 'No Role'}
                            </span>
                            <p className="text-gray-600 text-sm">
                                {isApprover ? "Review and authorize pending requests." : "Manage your procurement workflow efficiently."}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        {canManageProcurement && (
                            <>
                                <div className="text-center px-6 border-r">
                                    <p className="text-2xl font-bold text-gray-900">{rfqs.length}</p>
                                    <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold">Active RFQs</p>
                                </div>
                                <div className={`text-center px-6 ${isOwner ? 'border-r' : ''}`}>
                                    <p className="text-2xl font-bold text-gray-900">{rfqs.reduce((acc, curr) => acc + curr.quotes.length, 0)}</p>
                                    <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold">Quotes Received</p>
                                </div>
                            </>
                        )}
                        {canManageApprovals && pendingApprovalsCount > 0 && (
                            <div className="text-center px-6">
                                <Link href="/dashboard/approvals" className="group">
                                    <p className="text-2xl font-bold text-indigo-600 group-hover:scale-110 transition-transform">
                                        {pendingApprovalsCount}
                                    </p>
                                    <p className="text-xs text-gray-600 uppercase tracking-widest font-semibold">Action Required</p>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* RFQ List Section */}
                {canManageProcurement && (
                    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Requests for Quotation (RFQs)</h3>
                            <div className="flex gap-2">
                                <button className="p-2 border rounded-lg hover:bg-gray-50 text-gray-600"><Filter className="h-4 w-4" /></button>
                                <Link href="/dashboard/rfq/create" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                                    <Plus className="h-4 w-4" />
                                    Create RFQ
                                </Link>
                            </div>
                        </div>

                        {loadingRfqs ? (
                            <div className="p-12 flex justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                            </div>
                        ) : rfqs.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="bg-gray-50 inline-flex p-4 rounded-full mb-4 text-gray-300">
                                    <FileText className="h-8 w-8" />
                                </div>
                                <p className="text-gray-600 italic">No RFQs found for this organization.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Title & Progress</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Due Date</th>
                                            <th className="px-6 py-4">Suppliers</th>
                                            <th className="px-6 py-4">Quotes</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {rfqs.map((rfq) => (
                                            <tr key={rfq.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <Link href={`/dashboard/rfq/detail?id=${rfq.id}`} className="font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                                                        {rfq.title}
                                                    </Link>
                                                    <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 rounded-full ${rfq.status === 'CLOSED' ? 'bg-green-500' :
                                                                rfq.status === 'SENT' ? 'bg-blue-500' :
                                                                    'bg-amber-400'
                                                                }`}
                                                            style={{
                                                                width: rfq.status === 'CLOSED' ? '100%' :
                                                                    rfq.status === 'SENT' ? '60%' :
                                                                        '20%'
                                                            }}
                                                        ></div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${rfq.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                                                        rfq.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {rfq.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(rfq.dueDate).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-2">
                                                        {rfq.suppliers.slice(0, 3).map((_, i) => (
                                                            <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                                                                <Users className="h-3 w-3 text-gray-600" />
                                                            </div>
                                                        ))}
                                                        {rfq.suppliers.length > 3 && (
                                                            <div className="h-7 w-7 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                                                +{rfq.suppliers.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="inline-flex items-center gap-1 text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                        {rfq.quotes.length}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/dashboard/rfq/detail?id=${rfq.id}`} className="text-gray-400 hover:text-indigo-600 transition-colors">
                                                        <ChevronRight className="h-5 w-5" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Management Section / Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Primary Widget based on role */}
                    {canManageProcurement ? (
                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-500" />
                                    Suppliers / Vendors
                                </h4>
                                <Link href="/dashboard/suppliers" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                                    View All
                                </Link>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                {loadingSuppliers ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                                    </div>
                                ) : suppliers.length === 0 ? (
                                    <p className="text-xs text-gray-600 italic py-4">No suppliers added yet.</p>
                                ) : (
                                    suppliers.slice(0, 5).map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-indigo-100 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800">{s.name}</span>
                                                <span className="text-[10px] text-gray-600">{s.email}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                                {s.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-gray-500" />
                                    Pending Approvals
                                </h4>
                                <Link href="/dashboard/approvals" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                                    Manage
                                </Link>
                            </div>
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                    <ShieldCheck className="h-8 w-8 text-indigo-600" />
                                </div>
                                <p className="text-2xl font-black text-gray-900">{pendingApprovalsCount}</p>
                                <p className="text-sm text-gray-500 font-medium">Requests awaiting your review</p>
                                <Link href="/dashboard/approvals" className="mt-4 text-sm font-bold text-white bg-indigo-600 px-6 py-2 rounded-xl hover:bg-indigo-700 transition-all">
                                    View Requests
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Secondary Widget: Recent Activity (all roles) + Quick Actions (owners) */}
                    <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col">
                        {isOwner && (
                            <div className="mb-6 pb-5 border-b border-dashed">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4 text-gray-500" />
                                    Quick Actions
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Invite Member</label>
                                        <div className="mt-1 flex gap-2">
                                            <input
                                                type="email"
                                                placeholder="email@example.com"
                                                value={inviteEmail}
                                                onChange={e => setInviteEmail(e.target.value)}
                                                className="flex-1 bg-gray-50 border-none rounded-lg px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <select
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value as any)}
                                                className="bg-gray-50 border-none rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 font-medium"
                                            >

                                                <option value="procurement">Procurement</option>
                                                <option value="approver">Approver</option>
                                            </select>
                                            <button onClick={handleInviteMember} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all">Invite</button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href="/dashboard/suppliers" className="flex-1 bg-indigo-50 text-indigo-700 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all border border-indigo-100 block text-center">
                                            + Add Supplier
                                        </Link>
                                        <Link href="/dashboard/rfq/create" className="flex-1 bg-white text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all border border-gray-200 block text-center">
                                            + Create RFQ
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                Recent Activity
                            </h4>
                            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                                {activityLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                                    </div>
                                ) : activityItems.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic py-6 text-center">No recent activity yet.</p>
                                ) : (
                                    activityItems.map((item) => (
                                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                            <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${item.type === 'success' ? 'bg-green-500' :
                                                item.type === 'info' ? 'bg-blue-500' :
                                                    item.type === 'warning' ? 'bg-amber-500' :
                                                        'bg-gray-400'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(item.createdAt).toLocaleString(undefined, {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
