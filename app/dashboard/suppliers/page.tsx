"use client";

import { useActiveOrganization } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import { Users, Plus, Loader2, Mail, ArrowUpDown } from "lucide-react";
import { api } from "@/lib/api-client";
import { useSupplierStore } from "@/store/useSupplierStore";
import {
  DataTable,
  PageHeader,
  EmptyState,
  StatusBadge,
  LoadingSpinner,
  SearchInput,
  ConfirmDeleteButton,
} from "@/components/ui";

interface Supplier {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

const columnHelper = createColumnHelper<Supplier>();

export default function SuppliersPage() {
  const { data: activeOrg } = useActiveOrganization();
  const queryClient = useQueryClient();
  const { isCreating, toggleCreating, searchQuery, setSearchQuery } = useSupplierStore();
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", activeOrg?.id],
    queryFn: () => api.get<Supplier[]>(`/suppliers/org/${activeOrg?.id}`),
    enabled: !!activeOrg?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) => api.post("/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toggleCreating();
    },
    onError: (err: any) => alert(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (err: any) => alert(err.message),
  });

  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-gray-900" onClick={() => column.toggleSorting()}>
          Supplier Name <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: info => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
            {info.getValue().substring(0, 1).toUpperCase()}
          </div>
          <span className="font-bold text-gray-900">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("email", {
      header: "Contact",
      cell: info => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-3.5 w-3.5" />
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("createdAt", {
      header: "Added Date",
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: info => (
        <div className="text-right">
          <ConfirmDeleteButton
            onDelete={() => deleteMutation.mutate(info.row.original.id)}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === info.row.original.id}
          />
        </div>
      ),
    }),
  ], [deleteMutation]);

  const filteredData = useMemo(() =>
    suppliers.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    ), [suppliers, searchQuery]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Suppliers"
          subtitle="Manage external vendors and suppliers for your organization."
          action={
            <button
              onClick={toggleCreating}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCreating ? 'bg-gray-100 text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              <Plus className={`h-4 w-4 transition-transform ${isCreating ? 'rotate-45' : ''}`} />
              {isCreating ? 'Cancel' : 'Add Supplier'}
            </button>
          }
        />

        {isCreating && (
          <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-bold text-gray-900 mb-4">Add New Supplier</h3>
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="contact@supplier.com"
                  className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Supplier'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex items-center gap-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search suppliers..."
            />
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : filteredData.length === 0 ? (
            <EmptyState icon={Users} title="No suppliers found." />
          ) : (
            <DataTable table={table} />
          )}
        </div>
      </div>
    </div>
  );
}
