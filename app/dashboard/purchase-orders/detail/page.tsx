"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Building2,
    Calendar,
    FileText,
    DollarSign,
    ShieldCheck,
    Clock,
    Download,
    Printer,
    CheckCircle2,
    XCircle,
    Loader2,
    Trash2,
    Send
} from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { API_BASE } from "@/lib/api";

interface POItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
}

interface PODetails {
    id: string;
    buyerOrgId: string;
    supplierId: string;
    rfqId: string;
    quoteId: string;
    totalAmount: number;
    status: string;
    notes: string;
    createdAt: string;
    supplier: {
        id: string;
        name: string;
        email: string;
    };
    quote: {
        id: string;
        rfq: {
            title: string;
            items: POItem[];
        }
    }
}

function PODetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const router = useRouter();
    const { data: session } = useSession();
    const [po, setPo] = useState<any | null>(null);
    const [loading, setLoading] = useState(!!id);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        const fetchPO = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/purchase-orders/${id}`, {
                    credentials: "include"
                });
                if (!res.ok) throw new Error("Failed to fetch Purchase Order details");
                const result = await res.json();
                setPo(result.data || result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPO();
    }, [id]);

    const handleDeletePO = async () => {
        if (!id) return;
        if (!confirm("Are you sure you want to delete this Purchase Order? This action cannot be undone.")) return;
        try {
            const res = await fetch(`${API_BASE}/purchase-orders/${id}`, {
                method: 'DELETE',
                credentials: "include",
            });
            if (res.ok) {
                router.push('/dashboard/purchase-orders');
            } else {
                alert("Failed to delete Purchase Order");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting Purchase Order");
        }
    };

    const handleSendPO = async () => {
        if (!id) return;
        if (!confirm("Send this Purchase Order to the supplier?")) return;
        setSending(true);
        try {
            const res = await fetch(`${API_BASE}/purchase-orders/${id}/send`, {
                method: 'POST',
                credentials: "include",
            });
            if (res.ok) {
                const result = await res.json();
                const actualUpdated = result.data || result;
                setPo({ ...po, status: actualUpdated.status });
                alert("Purchase Order sent to supplier!");
            } else {
                const errData = await res.json();
                alert(errData.message || "Failed to send Purchase Order");
            }
        } catch (err) {
            console.error(err);
            alert("Error sending Purchase Order");
        } finally {
            setSending(false);
        }
    };

    if (!id) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Order</h1>
                    <p className="mt-2 text-gray-600">No purchase order ID provided.</p>
                    <Link href="/dashboard/purchase-orders" className="mt-4 inline-block text-indigo-600 hover:underline">
                        Back to Purchase Orders
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !po) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Error</h1>
                    <p className="mt-2 text-gray-600">{error || "Purchase Order not found"}</p>
                    <Link href="/dashboard/purchase-orders" className="mt-4 inline-block text-indigo-600 hover:underline">
                        Back to Purchase Orders
                    </Link>
                </div>
            </div>
        );
    }

    const items = po.quote?.rfq?.items || [];

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/purchase-orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                <ChevronLeft className="h-5 w-5" />
                            </Link>
                            <div>
                                <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                                    <span>Purchase Orders</span>
                                    <span>/</span>
                                    <span className="text-indigo-600">PO-{po.id.substring(0, 8)}</span>
                                </nav>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    Purchase Order
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${po.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                                        po.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            po.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {po.status}
                                    </span>
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {po.status === 'APPROVED' && (
                                <button
                                    onClick={handleSendPO}
                                    disabled={sending}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-100 disabled:opacity-50"
                                >
                                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Send to Supplier
                                </button>
                            )}
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            >
                                <Printer className="h-4 w-4" />
                                Print / PDF
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100"
                            >
                                <Download className="h-4 w-4" />
                                Download File
                            </button>
                            <button
                                onClick={handleDeletePO}
                                className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete PO
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-8">

                        <div className="bg-white rounded-2xl shadow-sm border p-8 grid grid-cols-2 gap-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Building2 className="h-32 w-32 text-gray-900" />
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">From (Buyer)</label>
                                    <p className="text-lg font-black text-gray-900">{po.buyerOrg?.name || "Our Organization"}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Created At</label>
                                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {new Date(po.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">To (Supplier)</label>
                                    <p className="text-lg font-black text-indigo-600">{po.supplier?.name}</p>
                                    <p className="text-xs text-gray-500">{po.supplier?.email}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Order Total</label>
                                    <p className="text-2xl font-black text-gray-900 flex items-center gap-1">
                                        <DollarSign className="h-6 w-6 text-green-600" />
                                        {po.totalAmount?.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {po.notes && (
                                <div className="col-span-2 pt-6 border-t border-dashed">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order Notes</label>
                                    <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 italic text-sm text-gray-700 leading-relaxed font-medium">
                                        {po.notes}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            <div className="px-8 py-5 border-b bg-gray-50/50">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-indigo-600" />
                                    Ordered Items
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <th className="px-8 py-4">Item & Description</th>
                                            <th className="px-8 py-4">Quantity</th>
                                            <th className="px-8 py-4">Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <p className="text-sm font-black text-gray-900">{item.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-bold text-gray-900">{item.quantity}</span>
                                                </td>
                                                <td className="px-8 py-5 text-xs text-gray-500 font-medium">
                                                    {item.unit}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">

                        <div className="bg-white rounded-2xl shadow-sm border p-6">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                                Track Record
                            </h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="w-0.5 h-10 bg-gray-100"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">PO Raised</p>
                                        <p className="text-[10px] text-gray-500">{new Date(po.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        {po.status === 'APPROVED' ? (
                                            <>
                                                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                </div>
                                            </>
                                        ) : po.status === 'REJECTED' ? (
                                            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                                                <XCircle className="h-4 w-4 text-red-600" />
                                            </div>
                                        ) : (
                                            <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center">
                                                <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
                                            </div>
                                        )}
                                        <div className="w-0.5 h-10 bg-gray-100"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">
                                            {po.status === 'PENDING_APPROVAL' ? 'Awaiting Approval' :
                                                po.status === 'APPROVED' ? 'Order Approved' : 'Rejected'}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            {po.status === 'PENDING_APPROVAL' ? 'Rules engine active' : 'Final authorization granted'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`flex gap-4 ${po.status !== 'APPROVED' && po.status !== 'SENT' ? 'opacity-30' : ''}`}>
                                    <div className="flex flex-col items-center">
                                        {po.status === 'SENT' ? (
                                            <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            </div>
                                        ) : po.status === 'APPROVED' ? (
                                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Clock className="h-4 w-4 text-blue-600" />
                                            </div>
                                        ) : (
                                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">Sent to Supplier</p>
                                        <p className="text-[10px] text-gray-500">
                                            {po.status === 'SENT' ? 'Email dispatched to supplier' :
                                                po.status === 'APPROVED' ? 'Ready to send' : 'Awaiting approval'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PODetailPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        }>
            <PODetailContent />
        </Suspense>
    );
}
