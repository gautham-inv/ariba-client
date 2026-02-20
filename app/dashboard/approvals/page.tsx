"use client";

import { useActiveOrganization } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    CheckCircle,
    XCircle,
    Loader2,
    ShieldCheck,
    FileText,
    DollarSign,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { PageHeader, EmptyState, LoadingSpinner, StatusBadge } from "@/components/ui";

interface ApprovalRequest {
    id: string;
    entityId: string;
    entityType: string;
    status: string;
    createdAt: string;
    purchaseOrder?: {
        totalAmount: number;
        currency: string;
        supplier: {
            name: string;
        };
    };
}

export default function ApprovalsPage() {
    const { data: activeOrg } = useActiveOrganization();
    const queryClient = useQueryClient();

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ["approvals", "pending", activeOrg?.id],
        queryFn: () => api.get<ApprovalRequest[]>(`/approvals/pending/${activeOrg?.id}`),
        enabled: !!activeOrg?.id,
    });

    const actionMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
            api.post(`/approvals/${id}/${action}`),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["approvals"] });
            alert(`Request ${variables.action}ed successfully`);
        },
        onError: (err: any) => alert(err.message),
    });

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Pending Approvals"
                    subtitle="Review and approve purchase orders and other requests."
                    icon={ShieldCheck}
                />

                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : requests.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle}
                            title="All Caught Up!"
                            message="No pending approvals found for your organization."
                            iconClassName="bg-green-50 text-green-600"
                        />
                    ) : (
                        <div className="divide-y">
                            {requests.map((req) => (
                                <div
                                    key={req.id}
                                    className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <StatusBadge status={req.entityType.replace("_", " ")} colorMap={{ [req.entityType.replace("_", " ")]: "bg-amber-100 text-amber-700" }} />
                                            <span className="text-xs text-gray-400">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                            {req.purchaseOrder ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-900">
                                                        Purchase Order for{" "}
                                                        <span className="text-indigo-600">{req.purchaseOrder.supplier.name}</span>
                                                    </span>
                                                    <div className="flex items-center gap-2 text-2xl font-black text-gray-900">
                                                        <DollarSign className="h-6 w-6 text-gray-400" />
                                                        {req.purchaseOrder.currency || 'USD'} {req.purchaseOrder.totalAmount.toLocaleString()}
                                                    </div>
                                                </div>
                                            ) : (
                                                `Request #${req.id.substring(0, 8)}`
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                                            <FileText className="h-4 w-4 text-gray-400" />
                                            Entity ID:{" "}
                                            <span className="font-mono text-xs text-gray-500">{req.entityId}</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => {
                                                if (confirm("Reject this request?"))
                                                    actionMutation.mutate({ id: req.id, action: "reject" });
                                            }}
                                            disabled={actionMutation.isPending}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all disabled:opacity-50"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm("Approve this request?"))
                                                    actionMutation.mutate({ id: req.id, action: "approve" });
                                            }}
                                            disabled={actionMutation.isPending}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                                        >
                                            {actionMutation.isPending && actionMutation.variables?.id === req.id ? (
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
