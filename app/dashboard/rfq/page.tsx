"use client";

import { useActiveOrganization } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { FileText, Plus, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  DataTable,
  PageHeader,
  EmptyState,
  StatusBadge,
  LoadingSpinner,
  ConfirmDeleteButton,
} from "@/components/ui";

interface RFQShort {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  createdAt: string;
  _count?: {
    suppliers: number;
    quotes: number;
  };
  suppliers: any[];
  quotes: any[];
}

const columnHelper = createColumnHelper<RFQShort>();

export default function RFQListPage() {
  const { data: activeOrg } = useActiveOrganization();
  const queryClient = useQueryClient();

  const { data: rfqs = [], isLoading } = useQuery({
    queryKey: ["rfqs", activeOrg?.id],
    queryFn: () => api.get<RFQShort[]>(`/rfq/org/${activeOrg?.id}`),
    enabled: !!activeOrg?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rfq/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
    },
    onError: (err: any) => alert(err.message),
  });

  const columns = useMemo(() => [
    columnHelper.accessor("status", {
      header: "Status",
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("title", {
      header: "RFQ Details",
      cell: info => (
        <div>
          <p className="text-sm font-black text-gray-900 group-hover:text-indigo-700 transition-colors">{info.getValue()}</p>
          <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1 font-bold">
            ID: {info.row.original.id.substring(0, 8).toUpperCase()}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("quotes", {
      id: "bids",
      header: () => <div className="text-center">Bids</div>,
      cell: info => (
        <div className="flex flex-col items-center">
          <span className="text-sm font-black text-gray-900">{info.getValue()?.length || 0}</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase">Received</span>
        </div>
      ),
    }),
    columnHelper.accessor("dueDate", {
      header: "Due Date",
      cell: info => (
        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400" />
          {new Date(info.getValue()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: info => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/dashboard/rfq/detail?id=${info.row.original.id}`}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 group-hover:border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 group-hover:text-indigo-700 transition-all shadow-sm"
          >
            View Details
            <ChevronRight className="h-3 w-3" />
          </Link>
          <ConfirmDeleteButton
            onDelete={() => deleteMutation.mutate(info.row.original.id)}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === info.row.original.id}
            title="Delete RFQ"
          />
        </div>
      ),
    }),
  ], [deleteMutation]);

  const table = useReactTable({
    data: rfqs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Requests for Quote"
        subtitle="Manage and track all your procurement requests in one place."
        icon={FileText}
        action={
          <Link
            href="/dashboard/rfq/create"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="h-5 w-5" />
            Create New RFQ
          </Link>
        }
      />

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner label="Loading requests..." />
        ) : rfqs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No RFQs Found"
            message="You haven't created any Requests for Quotation yet."
            action={
              <Link href="/dashboard/rfq/create" className="text-indigo-600 font-bold hover:underline">
                Create your first RFQ
              </Link>
            }
          />
        ) : (
          <DataTable
            table={table}
            headerClassName="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest"
            cellPadding="px-8 py-5"
          />
        )}
      </div>

      {/* Quick Stats Grid */}
      {!isLoading && rfqs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100">
            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Total RFQs</p>
            <p className="text-3xl font-black">{rfqs.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Active Requests</p>
            <p className="text-3xl font-black text-gray-900">
              {rfqs.filter(r => r.status === 'SENT').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Bids</p>
            <p className="text-3xl font-black text-gray-900">
              {rfqs.reduce((acc, curr) => acc + (curr.quotes?.length || 0), 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
