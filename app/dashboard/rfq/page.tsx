"use client";

import { useEffect, useState } from "react";
import { useActiveOrganization } from "@/lib/auth-client";
import {
    FileText,
    Plus,
    Calendar,
    ChevronRight,
    Clock,
    Loader2,
    Search,
    Filter
} from "lucide-react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

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

export default function RFQListPage() {
    const { data: activeOrg } = useActiveOrganization();
    const [rfqs, setRfqs] = useState<RFQShort[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (activeOrg) {
            fetchRFQs();
        }
    }, [activeOrg]);

    const fetchRFQs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/rfq/org/${activeOrg!.id}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setRfqs(data);
            }
        } catch (err) {
            console.error("Failed to fetch RFQs", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredRfqs = rfqs.filter(rfq =>
        rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rfq.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <FileText className="h-8 w-8 text-indigo-600" />
                        Requests for Quote
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Manage and track all your procurement requests in one place.</p>
                </div>
                <Link
                    href="/dashboard/rfq/create"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
                >
                    <Plus className="h-5 w-5" />
                    Create New RFQ
                </Link>
            </div>

            {/* Filters/Search */}
            <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search RFQs by title or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                    <button
                        onClick={fetchRFQs}
                        className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        <Clock className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* RFQs List */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                        <p className="text-gray-500 font-bold animate-pulse">Loading requests...</p>
                    </div>
                ) : filteredRfqs.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                            <FileText className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No RFQs Found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            {searchQuery ? "No requests match your search criteria." : "You haven't created any Requests for Quotation yet."}
                        </p>
                        {!searchQuery && (
                            <Link href="/dashboard/rfq/create" className="text-indigo-600 font-bold hover:underline">
                                Create your first RFQ
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">RFQ Details</th>
                                    <th className="px-8 py-4 text-center">Bids</th>
                                    <th className="px-8 py-4">Due Date</th>
                                    <th className="px-8 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRfqs.map((rfq) => (
                                    <tr key={rfq.id} className="group hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${rfq.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                                                    rfq.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                                                        rfq.status === 'CLOSED' ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>
                                                {rfq.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-black text-gray-900 group-hover:text-indigo-700 transition-colors">{rfq.title}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1 font-bold">
                                                ID: {rfq.id.substring(0, 8).toUpperCase()}
                                            </p>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-black text-gray-900">{rfq.quotes?.length || 0}</span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">Received</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {new Date(rfq.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <Link
                                                href={`/dashboard/rfq/detail?id=${rfq.id}`}
                                                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 group-hover:border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 group-hover:text-indigo-700 transition-all shadow-sm"
                                            >
                                                View Details
                                                <ChevronRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Quick Stats Grid */}
            {!loading && filteredRfqs.length > 0 && (
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
