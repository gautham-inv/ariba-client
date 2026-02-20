import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    /** Lucide icon component rendered beside the title */
    icon?: LucideIcon;
    /** Render an action button / link on the right side */
    action?: ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    {Icon && <Icon className="h-8 w-8 text-indigo-600" />}
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-gray-600 mt-1">{subtitle}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
