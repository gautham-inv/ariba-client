"use client";

import { useActiveOrganization, useActiveMember } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import {
    Users,
    Mail,
    Shield,
    Loader2,
    Clock
} from "lucide-react";

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

export default function TeamPage() {
    const { data: activeOrg } = useActiveOrganization();
    const { data: activeMember } = useActiveMember();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    const role = activeMember?.role || (activeOrg as any)?.membership?.role;
    const isOwnerOrAdmin = ['owner', 'admin', 'org_owner'].includes(role?.toLowerCase() || '');

    useEffect(() => {
        if (activeOrg && isOwnerOrAdmin) {
            fetchMembers();
        } else {
            setLoading(false);
        }
    }, [activeOrg, isOwnerOrAdmin]);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:3000/organization/members`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
            }
        } catch (err) {
            console.error("Failed to fetch members", err);
        } finally {
            setLoading(false);
        }
    };

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
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                    <p className="text-gray-600 mt-1">View users in your organization.</p>
                </div>

                {/* Members List */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                        </div>
                    ) : members.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="bg-gray-50 inline-flex p-4 rounded-full mb-4 text-gray-300">
                                <Users className="h-8 w-8" />
                            </div>
                            <p className="text-gray-600 font-medium">No members found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Member</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {members.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                                        {member.user.name?.substring(0, 1).toUpperCase() || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{member.user.name}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {member.user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${member.role === 'owner' || member.role === 'org_owner' ? 'bg-indigo-100 text-indigo-700' :
                                                    member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        member.role === 'procurement' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {new Date(member.createdAt).toLocaleDateString()}
                                                </span>
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
