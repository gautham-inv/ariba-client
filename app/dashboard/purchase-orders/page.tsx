"use client";

import { useActiveOrganization, useSession } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import {
    CheckCircle,
    Search,
    Loader2,
    FileText,
    ChevronRight,
    DollarSign,
    Calendar,
    Briefcase,
    Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

interface PurchaseOrder {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    supplier: {
        name: string;
        email: string;
    };
    quote: {
        id: string;
    };
}

export default function PurchaseOrdersPage() {
    const { data: session, isPending: isSessionPending } = useSession();
    const { data: activeOrg, isPending: isActiveOrgPending } = useActiveOrganization();
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!isSessionPending && !session) {
            router.push("/sign-in");
        }
    }, [session, isSessionPending, router]);

    useEffect(() => {
        // In single-org mode, just wait for activeOrg to be loaded, then fetch POs
        if (activeOrg) {
            fetchPOs();
        }
    }, [activeOrg]);

    const fetchPOs = async () => {
        if (!activeOrg) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/purchase-orders/org/${activeOrg.id}`, {
                credentials: "include"
            });
            if (res.ok) {
                const result = await res.json();
                setPos(result.data || result);
            }
        } catch (err) {
            console.error("Failed to fetch POs", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePO = async (id: string) => {
        if (!confirm("Are you sure you want to delete this Purchase Order?")) return;

        try {
            const res = await fetch(`${API_BASE}/purchase-orders/${id}`, {
                method: 'DELETE',
                credentials: "include",
            });

            if (res.ok) {
                fetchPOs();
            } else {
                const error = await res.json();
                alert(error.message || "Failed to delete PO");
            }
        } catch (err) {
            console.error("Failed to delete PO", err);
            alert("Network error");
        }
    };

    const filteredPos = pos.filter(po =>
        po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isSessionPending || isActiveOrgPending) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!session || !activeOrg) return null;

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                        <p className="text-gray-600 mt-1">Track and manage issued purchase orders.</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by PO # or Supplier..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>

                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                    ) : filteredPos.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-gray-50 inline-flex p-4 rounded-full mb-4 text-gray-300">
                                <Briefcase className="h-8 w-8" />
                            </div>
                            <p className="text-gray-600 font-medium">No Purchase Orders found.</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Purchase Orders are generated from confirmed quotes in the RFQ section.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">PO Number</th>
                                        <th className="px-6 py-4">Supplier</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Created Date</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredPos.map((po) => (
                                        <tr key={po.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900 text-sm">PO-{po.id.substring(0, 8).toUpperCase()}</span>
                                                        <span className="text-[10px] text-gray-500 font-mono">ID: {po.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-900 text-sm">{po.supplier.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${po.status === 'APPROVED' || po.status === 'SENT' ? 'bg-green-100 text-green-700' :
                                                    po.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {po.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 font-bold text-gray-900 text-sm">
                                                    <DollarSign className="h-3 w-3 text-gray-400" />
                                                    {po.totalAmount.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {new Date(po.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/dashboard/purchase-orders/detail?id=${po.id}`} className="text-gray-400 hover:text-indigo-600 transition-colors">
                                                        <ChevronRight className="h-5 w-5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeletePO(po.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete PO"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
