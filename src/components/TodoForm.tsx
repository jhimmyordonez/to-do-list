import { useState, type FormEvent } from 'react';

interface TodoFormProps {
    onAdd: (title: string, category: string, repeatDays: number) => Promise<void>;
    disabled?: boolean;
}

export function TodoForm({ onAdd, disabled = false }: TodoFormProps) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [repeatDays, setRepeatDays] = useState(1); // Default to 1 day
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const trimmedTitle = title.trim();
        const trimmedCategory = category.trim();

        if (!trimmedTitle || !trimmedCategory || repeatDays < 1) return;

        setIsSubmitting(true);
        try {
            await onAdd(trimmedTitle, trimmedCategory, repeatDays);
            setTitle('');
            // Keep category and repeatDays for next task (user might add similar tasks)
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = title.trim() && category.trim() && repeatDays >= 1;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What do you need to do?"
                    disabled={disabled || isSubmitting}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                       placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            </div>

            {/* Category and Days row */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., Work, Health, Personal"
                        disabled={disabled || isSubmitting}
                        maxLength={50}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           placeholder-gray-400 disabled:bg-gray-100"
                    />
                </div>
                <div className="w-[120px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={repeatDays}
                        onChange={(e) => setRepeatDays(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        max={365}
                        disabled={disabled || isSubmitting}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           disabled:bg-gray-100"
                    />
                </div>
            </div>

            {/* Submit button */}
            <button
                type="submit"
                disabled={disabled || isSubmitting || !isValid}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-sm
                   hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                   focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors duration-200 flex items-center justify-center gap-2"
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
                        <span>Add Task ({repeatDays} {repeatDays === 1 ? 'day' : 'days'})</span>
                    </>
                )}
            </button>
        </form>
    );
}
