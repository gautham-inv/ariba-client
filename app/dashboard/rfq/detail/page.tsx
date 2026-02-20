"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  ChevronLeft,
  Mail,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  Trash2,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api-client";
import { LoadingSpinner, StatusBadge } from "@/components/ui";

interface RFQItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
}

interface RFQSupplier {
  supplier: Supplier;
  invitedAt: string;
}

interface Quote {
  id: string;
  supplier: Supplier;
  totalAmount: number;
  notes: string;
  status: string;
  submittedAt: string;
}

interface RFQDetails {
  id: string;
  title: string;
  dueDate: string;
  currency: string;
  notes: string;
  status: string;
  items: RFQItem[];
  suppliers: RFQSupplier[];
  quotes: Quote[];
  buyerOrgId: string;
  buyerOrg: { name: string };
}

function RFQDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");

  // Fetch RFQ details
  const { data: rfq, isLoading: loading, error } = useQuery({
    queryKey: ["rfq", id],
    queryFn: () => api.get<RFQDetails>(`/rfq/${id}`),
    enabled: !!id,
  });

  // Send RFQ mutation
  const sendMutation = useMutation({
    mutationFn: () => api.post(`/rfq/${id}/send`),
    onSuccess: () => {
      alert("RFQ sent to suppliers successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
    },
    onError: () => alert("Failed to send RFQ"),
  });

  // Add quote mutation
  const addQuoteMutation = useMutation({
    mutationFn: (payload: { supplierId: string; totalAmount: number; notes: string }) =>
      api.post(`/rfq/${id}/quote`, payload),
    onSuccess: () => {
      setShowQuoteModal(false);
      setQuoteAmount("");
      setQuoteNotes("");
      setSelectedSupplierId("");
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
    },
    onError: () => alert("Failed to add quote"),
  });

  // Confirm quote mutation
  const confirmMutation = useMutation({
    mutationFn: (quoteId: string) =>
      api.post(`/rfq/quote/${quoteId}/status`, { status: "CONFIRMED" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rfq", id] }),
    onError: () => alert("Failed to update status"),
  });

  // Create PO mutation
  const createPOMutation = useMutation({
    mutationFn: (quoteId: string) =>
      api.post<{ id: string }>("/purchase-orders", { quoteId, notes: `Created from Quote ${quoteId}` }),
    onSuccess: (data) => {
      alert("Purchase Order Created!");
      router.push(`/dashboard/purchase-orders/detail?id=${data.id}`);
    },
    onError: (err: any) => alert(err.message || "Failed to create PO"),
  });

  // Delete RFQ mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/rfq/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      router.push("/dashboard");
    },
    onError: () => alert("Failed to delete RFQ"),
  });

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">RFQ</h1>
          <p className="mt-2 text-gray-600">No RFQ ID provided.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen size="h-12 w-12" />;
  }

  if (error || !rfq) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">{(error as any)?.message || "RFQ not found"}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-indigo-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              </Link>
              <div>
                <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <span>RFQs</span>
                  <span>/</span>
                  <span className="text-indigo-600">Details</span>
                </nav>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  {rfq.title}
                  <StatusBadge status={rfq.status} />
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {rfq.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => sendMutation.mutate()}
                  disabled={sendMutation.isPending}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sendMutation.isPending ? "Sending…" : "Send to Suppliers"}
                </button>
              )}
              <button
                onClick={() => { if (confirm("Are you sure you want to delete this RFQ? All associated quotes and data will be permanently removed.")) deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete RFQ
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-8">

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Request Details
                </h2>
              </div>
              <div className="p-6 grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {new Date(rfq.dueDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {rfq.currency}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Instructions / Notes</label>
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">
                    {rfq.notes || "No notes provided."}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50">
                <h2 className="font-semibold text-gray-900">Line Items ({rfq.items.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Item Name & Description</th>
                      <th className="px-6 py-3">Quantity</th>
                      <th className="px-6 py-3">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {rfq.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-gray-500 text-xs">{item.description}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">{item.quantity}</td>
                        <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Bids Received ({rfq.quotes.length})
                </h2>
                <button
                  onClick={() => setShowQuoteModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Record External Bid
                </button>
              </div>

              {rfq.quotes.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="bg-gray-50 inline-flex p-4 rounded-full mb-4">
                    <Clock className="h-8 w-8 text-gray-300" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">No bids yet</h3>
                  <p className="text-xs text-gray-500 mt-1">Once you receive a bid via email, you can manually upload it here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-3">Supplier</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Date Received</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {rfq.quotes.map((quote) => (
                        <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                {quote.supplier.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{quote.supplier.name}</p>
                                <p className="text-gray-500 text-xs">{quote.supplier.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">
                              {rfq.currency} {quote.totalAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {new Date(quote.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {quote.status === 'RECEIVED' && (
                                <button
                                  onClick={() => { if (confirm("Are you sure you want to mark this quote as CONFIRMED?")) confirmMutation.mutate(quote.id); }}
                                  disabled={confirmMutation.isPending}
                                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                  {confirmMutation.isPending && confirmMutation.variables === quote.id ? '...' : 'Confirm'}
                                </button>
                              )}
                              {quote.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => { if (confirm("Create Purchase Order from this quote?")) createPOMutation.mutate(quote.id); }}
                                  disabled={createPOMutation.isPending}
                                  className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                                >
                                  {createPOMutation.isPending && createPOMutation.variables === quote.id ? '...' : 'Create PO'}
                                </button>
                              )}
                              {quote.status === 'ACCEPTED' && (
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                  PO Created
                                </span>
                              )}
                              <button className="text-gray-400 hover:text-gray-600 font-medium text-xs">Details</button>
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

          <div className="space-y-8">

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  Invited Suppliers
                </h2>
              </div>
              <div className="p-2">
                {rfq.suppliers.map((rs) => (
                  <div key={rs.supplier.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{rs.supplier.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {rs.supplier.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-900 rounded-xl shadow-xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-4">Sourcing Workflow</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="h-5 w-5 text-indigo-300" />
                      <div className="w-0.5 h-6 bg-indigo-700 my-1"></div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">RFQ Created</p>
                      <p className="text-xs text-indigo-300">Internal draft ready</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {rfq.status === 'SENT' || rfq.status === 'CLOSED' ? (
                        <CheckCircle2 className="h-5 w-5 text-indigo-300" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-indigo-500"></div>
                      )}
                      <div className="w-0.5 h-6 bg-indigo-700 my-1"></div>
                    </div>
                    <div className={rfq.status === 'DRAFT' ? 'opacity-50' : ''}>
                      <p className="text-sm font-semibold">Sent to Suppliers</p>
                      <p className="text-xs text-indigo-300">Suppliers notified via email</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {rfq.status === 'CLOSED' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <div className={`h-5 w-5 rounded-full border-2 ${rfq.status === 'SENT' ? 'border-indigo-400 animate-pulse' : 'border-indigo-700'}`}></div>
                      )}
                    </div>
                    <div className={rfq.status !== 'CLOSED' && rfq.status !== 'SENT' ? 'opacity-50' : ''}>
                      <p className="text-sm font-semibold">Awarding & PO</p>
                      <p className="text-xs text-indigo-300">Convert best bid to order</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500 opacity-10 rounded-full blur-2xl"></div>
            </div>

          </div>
        </div>
      </div>

      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowQuoteModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Record Manual Bid</h3>
              <button onClick={() => setShowQuoteModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors italic text-xs">Esc to close</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                >
                  <option value="" className="text-gray-900">Choose a supplier...</option>
                  {rfq.suppliers.map(rs => (
                    <option key={rs.supplier.id} value={rs.supplier.id} className="text-gray-900 font-bold">{rs.supplier.name} ({rs.supplier.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Total Bid Amount ({rfq.currency})</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-900 font-black tracking-tight">{rfq.currency}</span>
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full bg-gray-50 border rounded-lg pl-20 pr-4 py-3 text-sm font-black text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Internal Notes / Summary</label>
                <textarea
                  rows={4}
                  placeholder="Summarize the supplier's response..."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  className="w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm text-gray-900 font-medium placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => addQuoteMutation.mutate({ supplierId: selectedSupplierId, totalAmount: parseFloat(quoteAmount), notes: quoteNotes })}
                  disabled={addQuoteMutation.isPending || !selectedSupplierId || !quoteAmount}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {addQuoteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Record Bid & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RFQDetailPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen size="h-12 w-12" />}>
      <RFQDetailContent />
    </Suspense>
  );
}
