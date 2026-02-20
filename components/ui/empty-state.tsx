import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    message?: string;
    /** Optional call-to-action rendered below the message */
    action?: ReactNode;
    /** Icon container color classes, defaults to neutral gray */
    iconClassName?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    message,
    action,
    iconClassName = "bg-gray-50 text-gray-300",
}: EmptyStateProps) {
    return (
        <div className="p-12 text-center">
            <div
                className={`inline-flex p-4 rounded-full mb-4 ${iconClassName}`}
            >
                <Icon className="h-8 w-8" />
            </div>
            <p className="text-gray-900 font-bold text-lg">{title}</p>
            {message && (
                <p className="text-gray-500 mt-1 max-w-xs mx-auto">{message}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
