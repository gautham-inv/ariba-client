"use client";

import { useSession, useActiveOrganization, useActiveMember, signOut } from "@/lib/auth-client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  Users,
  CheckCircle,
  LogOut,
  ShieldCheck,
  Bell,
  Loader2,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isSessionPending } = useSession();
  const { data: activeOrg, isPending: isActiveOrgPending } = useActiveOrganization();
  const { data: activeMember, isPending: isActiveMemberPending } = useActiveMember();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Precise role detection from multiple possible sources
  const activeMemberRole = activeMember?.role || (activeOrg as any)?.membership?.role;
  const role = activeMemberRole?.toLowerCase();

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isSessionPending, router]);

  // Note: In single-org mode, the server automatically sets activeOrganizationId
  // on session creation, so we don't need client-side logic to set it.
  // Just wait for the data to load.

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/organization/notifications`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  if (isSessionPending || isActiveOrgPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col hidden lg:flex sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">Ariba MVP</span>
          </div>

          <nav className="space-y-1">
            {isActiveMemberPending ? (
              <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-gray-300" /></div>
            ) : (
              <>
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg group hover:text-indigo-700 transition-colors">
                  <LayoutDashboard className="h-4 w-4 text-gray-500 group-hover:text-indigo-600" />
                  Dashboard
                </Link>

                {(role === 'owner' || role === 'admin' || role === 'org_owner' || role === 'procurement') && (
                  <>
                    <Link href="/dashboard/rfq" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg group hover:text-indigo-700 transition-colors">
                      <FileText className="h-4 w-4 text-gray-500 group-hover:text-indigo-600" />
                      RFQs
                    </Link>
                    <Link href="/dashboard/suppliers" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg group hover:text-indigo-700 transition-colors">
                      <Users className="h-4 w-4 text-gray-500 group-hover:text-indigo-600" />
                      Suppliers
                    </Link>
                  </>
                )}
                <Link href="/dashboard/purchase-orders" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg group hover:text-indigo-700 transition-colors">
                  <CheckCircle className="h-4 w-4 text-gray-500 group-hover:text-indigo-600" />
                  Purchase Orders
                </Link>
                {(role === 'owner' || role === 'admin' || role === 'org_owner' || role === 'approver') && (
                  <Link href="/dashboard/approvals" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg group hover:text-indigo-700 transition-colors">
                    <ShieldCheck className="h-4 w-4 text-gray-500 group-hover:text-indigo-600" />
                    Approvals
                  </Link>
                )}
                {(role === 'owner' || role === 'admin' || role === 'org_owner') && (
                  <>
                    <Link href="/dashboard/team" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg group hover:text-indigo-700 transition-colors border-t mt-4 pt-4">
                      <Users className="h-4 w-4 text-gray-500 group-hover:text-indigo-600" />
                      Team
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg group hover:text-indigo-700 transition-colors">
                      <ShieldCheck className="h-4 w-4 text-gray-500 group-hover:text-indigo-600" />
                      Rule Management
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Org</p>
            <p className="text-sm font-bold text-gray-900 truncate">{activeOrg?.name || "None"}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-4 flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="bg-white border-b h-16 flex items-center justify-end px-8 relative z-20">
          <div className="flex items-center gap-6">
            {(activeOrg as any)?.membership?.role && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  {(activeOrg as any).membership.role}
                </span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b bg-gray-50">
                    <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center italic">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-gray-900">{session.user.name}</span>
                <span className="text-xs text-gray-600">{session.user.email}</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                {session.user.name?.substring(0, 2).toUpperCase() || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
