import { useState, type FormEvent } from 'react';

interface GoalFormProps {
    onAdd: (title: string) => Promise<void>;
    disabled?: boolean;
}

export function GoalForm({ onAdd, disabled }: GoalFormProps) {
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        setIsSubmitting(true);
        try {
            await onAdd(trimmedTitle);
            setTitle('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDisabled = disabled || isSubmitting;

    return (
        <form onSubmit={handleSubmit} className="flex gap-3">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a new monthly goal..."
                disabled={isDisabled}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm
                   focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                   placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed
                   transition-colors duration-200"
            />
            <button
                type="submit"
                disabled={isDisabled || !title.trim()}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg shadow-sm
                   hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500
                   focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-colors duration-200 flex items-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Adding...</span>
                    </>
                ) : (
                    <>
                        <span className="text-lg">🎯</span>
                        <span>Add Goal</span>
                    </>
                )}
            </button>
        </form>
    );
}
