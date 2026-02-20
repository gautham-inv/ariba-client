import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    /** Optional label shown below the spinner */
    label?: string;
    /** Size class for the spinner icon, defaults to "h-6 w-6" */
    size?: string;
    /** Whether to render a full-screen centered spinner */
    fullScreen?: boolean;
}

export function LoadingSpinner({
    label,
    size = "h-6 w-6",
    fullScreen = false,
}: LoadingSpinnerProps) {
    const wrapper = fullScreen
        ? "flex h-screen items-center justify-center bg-gray-50"
        : "p-12 flex flex-col items-center justify-center";

    return (
        <div className={wrapper}>
            <Loader2 className={`${size} animate-spin text-indigo-600`} />
            {label && (
                <p className="text-gray-500 font-bold mt-4 animate-pulse">{label}</p>
            )}
        </div>
    );
}
