"use client";

import { useActiveOrganization, useSession } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import {
  FileText,
  ChevronRight,
  DollarSign,
  Calendar,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  DataTable,
  PageHeader,
  EmptyState,
  StatusBadge,
  LoadingSpinner,
  SearchInput,
  ConfirmDeleteButton,
} from "@/components/ui";

interface PurchaseOrder {
  id: string;
  totalAmount: number;
  currency: string;
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

const columnHelper = createColumnHelper<PurchaseOrder>();

export default function PurchaseOrdersPage() {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["purchase-orders", activeOrg?.id],
    queryFn: () => api.get<PurchaseOrder[]>(`/purchase-orders/org/${activeOrg?.id}`),
    enabled: !!activeOrg?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/purchase-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (err: any) => alert(err.message),
  });

  const filteredPos = useMemo(() =>
    pos.filter(po =>
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [pos, searchQuery]
  );

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "PO Number",
      cell: info => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 text-sm">PO-{info.getValue().substring(0, 8).toUpperCase()}</span>
            <span className="text-[10px] text-gray-500 font-mono">ID: {info.getValue()}</span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("supplier.name", {
      header: "Supplier",
      cell: info => <span className="font-medium text-gray-900 text-sm">{info.getValue()}</span>,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("totalAmount", {
      header: "Amount",
      cell: info => (
        <div className="flex items-center gap-1 font-bold text-gray-900 text-sm">
          <DollarSign className="h-3 w-3 text-gray-400" />
          {info.row.original.currency || 'USD'} {info.getValue().toLocaleString()}
        </div>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Created Date",
      cell: info => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(info.getValue()).toLocaleDateString()}
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right"></div>,
      cell: info => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/dashboard/purchase-orders/detail?id=${info.row.original.id}`} className="text-gray-400 hover:text-indigo-600 transition-colors">
            <ChevronRight className="h-5 w-5" />
          </Link>
          <ConfirmDeleteButton
            onDelete={() => deleteMutation.mutate(info.row.original.id)}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === info.row.original.id}
            title="Delete PO"
          />
        </div>
      ),
    }),
  ], [deleteMutation]);

  const table = useReactTable({
    data: filteredPos,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!session || !activeOrg) return null;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Purchase Orders"
          subtitle="Track and manage issued purchase orders."
        />

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between gap-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by PO # or Supplier..."
            />
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : filteredPos.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No Purchase Orders found."
              message="Purchase Orders are generated from confirmed quotes in the RFQ section."
            />
          ) : (
            <DataTable table={table} />
          )}
        </div>
      </div>
    </div>
  );
}
