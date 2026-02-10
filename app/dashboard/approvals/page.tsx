"use client";

import { useActiveOrganization, useSession, organization } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import {
    CheckCircle,
    XCircle,
    Loader2,
    ShieldCheck,
    AlertCircle,
    FileText,
    DollarSign
} from "lucide-react";

interface ApprovalRequest {
    id: string;
    entityId: string;
    entityType: string;
    status: string;
    createdAt: string;
    purchaseOrder?: {
        totalAmount: number;
        supplier: {
            name: string;
        }
    }
}

export default function ApprovalsPage() {
    const { data: session } = useSession();
    const { data: activeOrg } = useActiveOrganization();
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (activeOrg) {
            fetchPendingRequests();
        }
    }, [activeOrg]);

    const fetchPendingRequests = async () => {
        if (!activeOrg) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/approvals/pending/${activeOrg.id}`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (err) {
            console.error("Failed to fetch approvals", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action.toUpperCase()} this request?`)) return;

        setProcessingId(id);
        try {
            const res = await fetch(`http://localhost:3000/approvals/${id}/${action}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (res.ok) {
                // Remove from list
                setRequests(prev => prev.filter(r => r.id !== id));
                alert(`Request ${action}ed successfully`);
            } else {
                alert(`Failed to ${action} request`);
            }
        } catch (err) {
            console.error(err);
            alert("Error processing request");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <ShieldCheck className="h-8 w-8 text-indigo-600" />
                            Pending Approvals
                        </h1>
                        <p className="text-gray-600 mt-1">Review and approve purchase orders and other requests.</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-green-50 inline-flex p-4 rounded-full mb-4 text-green-600">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <p className="text-gray-900 font-bold text-lg">All Caught Up!</p>
                            <p className="text-gray-500 mt-1">No pending approvals found for your organization.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {requests.map((req) => (
                                <div key={req.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                {req.entityType.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                            {req.purchaseOrder ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-900">Purchase Order for <span className="text-indigo-600">{req.purchaseOrder.supplier.name}</span></span>
                                                    <div className="flex items-center gap-2 text-2xl font-black text-gray-900">
                                                        <DollarSign className="h-6 w-6 text-gray-400" />
                                                        {req.purchaseOrder.totalAmount.toLocaleString()}
                                                    </div>
                                                </div>
                                            ) : (
                                                `Request #${req.id.substring(0, 8)}`
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                                            <FileText className="h-4 w-4 text-gray-400" />
                                            Entity ID: <span className="font-mono text-xs text-gray-500">{req.entityId}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => handleAction(req.id, 'reject')}
                                            disabled={!!processingId}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all disabled:opacity-50"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'approve')}
                                            disabled={!!processingId}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                                        >
                                            {processingId === req.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <ShieldCheck className="h-4 w-4" />
                                            )}
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
