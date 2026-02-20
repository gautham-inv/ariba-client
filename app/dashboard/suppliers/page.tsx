"use client";

import { useActiveOrganization } from "@/lib/auth-client";
import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Loader2,
  Mail,
  MoreHorizontal,
  Trash2
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface Supplier {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function SuppliersPage() {
  const { data: activeOrg } = useActiveOrganization();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Mode
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creatingState, setCreatingState] = useState(false);

  useEffect(() => {
    if (activeOrg) {
      fetchSuppliers();
    }
  }, [activeOrg]);

  const fetchSuppliers = async () => {
    if (!activeOrg) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/suppliers/org/${activeOrg.id}`, {
        credentials: "include"
      });
      if (res.ok) {
        const result = await res.json();
        setSuppliers(result.data || result);
      }
    } catch (err) {
      console.error("Failed to fetch suppliers", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !newName || !newEmail) return;

    setCreatingState(true);
    try {
      const res = await fetch(`${API_BASE}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          name: newName,
          email: newEmail
        })
      });

      if (res.ok) {
        setNewName("");
        setNewEmail("");
        setIsCreating(false);
        fetchSuppliers();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to create supplier");
      }
    } catch (err) {
      console.error("Failed to create supplier", err);
      alert("Network error");
    } finally {
      setCreatingState(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier? This will also delete all their quotes and related purchase orders.")) return;

    try {
      const res = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'DELETE',
        credentials: "include",
      });

      if (res.ok) {
        fetchSuppliers();
      } else {
        const error = await res.json();
        alert(error.message || "Failed to delete supplier");
      }
    } catch (err) {
      console.error("Failed to delete supplier", err);
      alert("Network error");
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600 mt-1">Manage external vendors and suppliers for your organization.</p>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isCreating ? 'bg-gray-100 text-gray-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            <Plus className={`h-4 w-4 transition-transform ${isCreating ? 'rotate-45' : ''}`} />
            {isCreating ? 'Cancel' : 'Add Supplier'}
          </button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-bold text-gray-900 mb-4">Add New Supplier</h3>
            <form onSubmit={handleCreateSupplier} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="contact@supplier.com"
                  className="w-full bg-gray-50 border rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creatingState}
                className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {creatingState ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Supplier'}
              </button>
            </form>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-50 inline-flex p-4 rounded-full mb-4 text-gray-300">
                <Users className="h-8 w-8" />
              </div>
              <p className="text-gray-600 font-medium">No suppliers found.</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or add a new supplier.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Supplier Name</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Added Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                            {supplier.name.substring(0, 1).toUpperCase()}
                          </div>
                          <span className="font-bold text-gray-900">{supplier.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3.5 w-3.5" />
                          {supplier.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${supplier.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(supplier.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                          title="Delete Supplier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
