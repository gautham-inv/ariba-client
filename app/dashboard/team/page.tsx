"use client";

import { useActiveOrganization, useActiveMember, organization } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Users, Mail, Shield, Loader2, Clock } from "lucide-react";
import { api } from "@/lib/api-client";
import {
  DataTable,
  PageHeader,
  EmptyState,
  StatusBadge,
  LoadingSpinner,
  ConfirmDeleteButton,
} from "@/components/ui";

interface Member {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

const columnHelper = createColumnHelper<Member>();

export default function TeamPage() {
  const { data: activeOrg } = useActiveOrganization();
  const { data: activeMember } = useActiveMember();
  const queryClient = useQueryClient();

  const role = activeMember?.role || (activeOrg as any)?.membership?.role;
  const isOwnerOrAdmin = ['owner', 'admin', 'org_owner'].includes(role?.toLowerCase() || '');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", activeOrg?.id],
    queryFn: () => api.get<Member[]>(`/organization/members`),
    enabled: !!activeOrg?.id && isOwnerOrAdmin,
  });

  const removeMutation = useMutation({
    mutationFn: (memberIdOrEmail: string) => organization.removeMember({ memberIdOrEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err: any) => alert(err.message),
  });

  const columns = useMemo(() => [
    columnHelper.accessor("user.name", {
      header: "Member",
      cell: info => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
            {info.getValue()?.substring(0, 1).toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-bold text-gray-900">{info.getValue()}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {info.row.original.user.email}
            </p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("createdAt", {
      header: "Joined",
      cell: info => (
        <span className="text-sm text-gray-500 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: info => (
        <div className="text-right">
          <ConfirmDeleteButton
            onDelete={() => removeMutation.mutate(info.row.original.id)}
            isDeleting={removeMutation.isPending && removeMutation.variables === info.row.original.id}
            confirmMessage="Remove this member?"
            title="Remove Member"
          />
        </div>
      ),
    }),
  ], [removeMutation]);

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!isOwnerOrAdmin) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="bg-gray-100 inline-flex p-4 rounded-full mb-4">
            <Shield className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-gray-600 mt-2">Only owners and admins can view the team roster.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title="Team Members"
          subtitle="View users in your organization."
        />

        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {isLoading ? (
            <LoadingSpinner />
          ) : members.length === 0 ? (
            <EmptyState icon={Users} title="No members found." />
          ) : (
            <DataTable table={table} />
          )}
        </div>
      </div>
    </div>
  );
}
