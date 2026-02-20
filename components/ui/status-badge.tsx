interface StatusBadgeProps {
    status: string;
    /** Optional override for the color map */
    colorMap?: Record<string, string>;
}

/** Default color mappings for common procurement statuses */
const DEFAULT_COLOR_MAP: Record<string, string> = {
    DRAFT: "bg-amber-100 text-amber-700",
    SENT: "bg-blue-100 text-blue-700",
    CLOSED: "bg-green-100 text-green-700",
    ACTIVE: "bg-green-100 text-green-700",
    APPROVED: "bg-green-100 text-green-700",
    CONFIRMED: "bg-green-100 text-green-700",
    ACCEPTED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    PENDING: "bg-amber-100 text-amber-700",
    PENDING_APPROVAL: "bg-amber-100 text-amber-700",
    RECEIVED: "bg-blue-100 text-blue-700",
    // Roles
    owner: "bg-indigo-100 text-indigo-700",
    org_owner: "bg-indigo-100 text-indigo-700",
    admin: "bg-purple-100 text-purple-700",
    procurement: "bg-blue-100 text-blue-700",
    approver: "bg-amber-100 text-amber-700",
};

export function StatusBadge({ status, colorMap }: StatusBadgeProps) {
    const map = { ...DEFAULT_COLOR_MAP, ...colorMap };
    const colors = map[status] || "bg-gray-100 text-gray-600";

    return (
        <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors}`}
        >
            {status.replace(/_/g, " ")}
        </span>
    );
}
