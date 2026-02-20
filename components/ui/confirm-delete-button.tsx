import { Loader2, Trash2 } from "lucide-react";

interface ConfirmDeleteButtonProps {
    /** Called when the user confirms deletion */
    onDelete: () => void;
    /** Whether the delete action is currently in progress */
    isDeleting?: boolean;
    /** Custom confirmation message */
    confirmMessage?: string;
    /** Optional disabled state independent of isDeleting */
    disabled?: boolean;
    /** Override the button title */
    title?: string;
}

export function ConfirmDeleteButton({
    onDelete,
    isDeleting = false,
    confirmMessage = "Are you sure?",
    disabled = false,
    title = "Delete",
}: ConfirmDeleteButtonProps) {
    const handleClick = () => {
        if (confirm(confirmMessage)) {
            onDelete();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isDeleting || disabled}
            title={title}
            className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
        >
            {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </button>
    );
}
