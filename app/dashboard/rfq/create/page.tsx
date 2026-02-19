"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Type,
  BadgeDollarSign,
  FileText,
  Loader2,
  Check
} from "lucide-react";
import Link from "next/link";
import { useActiveOrganization, useSession } from "@/lib/auth-client";
import { API_BASE } from "@/lib/api";

interface Supplier {
  id: string;
  name: string;
  email: string;
}

interface Item {
  name: string;
  description: string;
  quantity: number;
  unit: string;
}

const RFQ_DRAFT_KEY = "ariba-rfq-create-draft";

function loadDraft(): Partial<{ title: string; dueDate: string; currency: string; notes: string; items: Item[]; selectedSuppliers: string[] }> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RFQ_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.items) && data.items.length > 0 && Array.isArray(data.selectedSuppliers)) {
      return {
        title: typeof data.title === "string" ? data.title : "",
        dueDate: typeof data.dueDate === "string" ? data.dueDate : "",
        currency: typeof data.currency === "string" ? data.currency : "USD",
        notes: typeof data.notes === "string" ? data.notes : "",
        items: data.items.map((i: any) => ({
          name: typeof i.name === "string" ? i.name : "",
          description: typeof i.description === "string" ? i.description : "",
          quantity: typeof i.quantity === "number" && !isNaN(i.quantity) ? i.quantity : 1,
          unit: typeof i.unit === "string" ? i.unit : "PCS",
        })),
        selectedSuppliers: data.selectedSuppliers.filter((s: unknown) => typeof s === "string"),
      };
    }
  } catch (_) { /* ignore */ }
  return null;
}

function saveDraft(data: { title: string; dueDate: string; currency: string; notes: string; items: Item[]; selectedSuppliers: string[] }) {
  try {
    sessionStorage.setItem(RFQ_DRAFT_KEY, JSON.stringify(data));
  } catch (_) { /* ignore */ }
}

export default function CreateRFQPage() {
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const { data: session } = useSession();

  const initialDraft = useMemo(() => loadDraft(), []);
  const [title, setTitle] = useState(initialDraft?.title ?? "");
  const [dueDate, setDueDate] = useState(initialDraft?.dueDate ?? "");
  const [currency, setCurrency] = useState(initialDraft?.currency ?? "USD");
  const [notes, setNotes] = useState(initialDraft?.notes ?? "");
  const [items, setItems] = useState<Item[]>(initialDraft?.items?.length ? initialDraft.items : [{ name: "", description: "", quantity: 1, unit: "PCS" }]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(initialDraft?.selectedSuppliers ?? []);

  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeOrg) {
      fetchSuppliers();
    }
  }, [activeOrg]);

  useEffect(() => {
    saveDraft({ title, dueDate, currency, notes, items, selectedSuppliers });
  }, [title, dueDate, currency, notes, items, selectedSuppliers]);

  const fetchSuppliers = async () => {
    if (!activeOrg) return;
    setLoadingSuppliers(true);
    try {
      const res = await fetch(`${API_BASE}/suppliers/org/${activeOrg.id}`, {
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        setAllSuppliers(result.data || result);
      }
    } catch (err) {
      console.error("Failed to fetch suppliers", err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { name: "", description: "", quantity: 1, unit: "PCS" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof Item, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || submitting) return;

    // Validation
    if (!title || !dueDate || items.some(i => !i.name) || selectedSuppliers.length === 0) {
      alert("Please fill in all required fields and select at least one supplier.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/rfq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          dueDate,
          currency,
          notes,
          items,
          supplierIds: selectedSuppliers,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const actualRfq = result.data || result;
        try { sessionStorage.removeItem(RFQ_DRAFT_KEY); } catch (_) { /* ignore */ }
        router.push(`/dashboard/rfq/detail?id=${actualRfq.id}`);
      } else {
        const error = await res.json();
        alert(`Error: ${error.message || "Failed to create RFQ"}`);
      }
    } catch (err) {
      alert("Critical Error creating RFQ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create New Request for Quote</h1>
              <p className="text-xs text-gray-500 mt-0.5">Draft is saved as you type. Use &quot;Send to Suppliers&quot; on the RFQ page when ready (SAP Ariba–style).</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            title="Save as draft (like SAP Ariba). Send to suppliers from the RFQ detail page when ready."
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save draft
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Form Fields */}
        <div className="lg:col-span-2 space-y-8">

          {/* Header Info */}
          <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <Type className="h-5 w-5" />
              <h2 className="font-bold text-gray-900">Basic Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-widest pl-1 mb-2">Project Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Office Furniture Upgrade Q1 2024"
                  className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-widest pl-1 mb-2">Submission Due Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      className="w-full bg-gray-50 border rounded-xl pl-12 pr-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase tracking-widest pl-1 mb-2">Currency *</label>
                  <div className="relative">
                    <BadgeDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      className="w-full bg-gray-50 border rounded-xl pl-12 pr-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none"
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                    >
                      <option value="USD" className="text-gray-900">USD - US Dollar</option>
                      <option value="EUR" className="text-gray-900">EUR - Euro</option>
                      <option value="GBP" className="text-gray-900">GBP - British Pound</option>
                      <option value="INR" className="text-gray-900">INR - Indian Rupee</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 uppercase tracking-widest pl-1 mb-2">Notes & Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Additional details for the suppliers..."
                  className="w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-8 py-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileText className="h-5 w-5" />
                <h2 className="font-bold text-gray-900">Items / Services Requested</h2>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all"
              >
                <Plus className="h-3 w-3" />
                Add Line Item
              </button>
            </div>

            <div className="p-8 space-y-6">
              {items.map((item, index) => (
                <div key={index} className="relative group bg-gray-50/50 p-6 rounded-2xl border border-dashed hover:border-indigo-200 transition-all">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="absolute -top-3 -right-3 p-2 bg-white border shadow-sm rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <input
                        placeholder="Item Name"
                        className="w-full border rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={item.name}
                        onChange={e => handleItemChange(index, "name", e.target.value)}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Qty"
                        className="w-full border rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={isNaN(item.quantity) ? "" : item.quantity}
                        onChange={e => handleItemChange(index, "quantity", parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <input
                        placeholder="Unit"
                        className="w-full border rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={item.unit}
                        onChange={e => handleItemChange(index, "unit", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-4 mt-2">
                      <textarea
                        placeholder="Short description or specifications..."
                        rows={1}
                        className="w-full border rounded-lg px-4 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={item.description}
                        onChange={e => handleItemChange(index, "description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Selection (Suppliers) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-600" />
                Select Suppliers *
              </h3>
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto">
              {loadingSuppliers ? (
                <div className="py-12 text-center text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-xs">Loading vendor list...</p>
                </div>
              ) : allSuppliers.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs text-gray-500 italic">No suppliers found.</p>
                  <Link href="/dashboard/suppliers" className="text-xs font-bold text-indigo-600 mt-2 block">Add your first supplier</Link>
                  <p className="text-[10px] text-gray-400 mt-2">Your draft is saved; it will be here when you return.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allSuppliers.map(s => (
                    <div
                      key={s.id}
                      onClick={() => toggleSupplier(s.id)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${selectedSuppliers.includes(s.id)
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-transparent hover:bg-gray-50'
                        }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{s.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{s.email}</p>
                      </div>
                      {selectedSuppliers.includes(s.id) && (
                        <div className="bg-indigo-600 rounded-full p-1 shadow-sm">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50/50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-700 font-medium">Selected Suppliers:</span>
                <span className="font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{selectedSuppliers.length}</span>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
