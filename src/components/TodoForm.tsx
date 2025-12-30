import { useState, type FormEvent } from 'react';

interface TodoFormProps {
    onAdd: (title: string) => Promise<void>;
    disabled?: boolean;
}

export function TodoForm({ onAdd, disabled = false }: TodoFormProps) {
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

    return (
        <form onSubmit={handleSubmit} className="flex gap-3">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you need to do today?"
                disabled={disabled || isSubmitting}
                maxLength={500}
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                   placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed
                   transition-shadow duration-200"
            />
            <button
                type="submit"
                disabled={disabled || isSubmitting || !title.trim()}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm
                   hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                   focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors duration-200 flex items-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Adding...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add</span>
                    </>
                )}
            </button>
        </form>
    );
}
