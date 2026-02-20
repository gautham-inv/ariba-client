import { create } from 'zustand';

interface DashboardUIState {
    inviteEmail: string;
    setInviteEmail: (email: string) => void;
    inviteRole: "procurement" | "approver";
    setInviteRole: (role: "procurement" | "approver") => void;
}

export const useDashboardStore = create<DashboardUIState>((set) => ({
    inviteEmail: '',
    setInviteEmail: (email) => set({ inviteEmail: email }),
    inviteRole: 'procurement',
    setInviteRole: (role) => set({ inviteRole: role }),
}));
