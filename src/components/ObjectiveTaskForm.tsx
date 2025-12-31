import { useState } from 'react';

interface ObjectiveTaskFormProps {
    onAdd: (title: string, category: string) => Promise<void>;
    disabled?: boolean;
}

const SUGGESTED_CATEGORIES = [
    'Vocabulary',
    'Grammar',
    'Reading',
    'Writing',
    'Listening',
    'Speaking',
    'Practice',
    'Review'
];

export function ObjectiveTaskForm({ onAdd, disabled }: ObjectiveTaskFormProps) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !category.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAdd(title.trim(), category.trim());
            setTitle('');
            setCategory('');
            setShowForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!showForm) {
        return (
            <button
                onClick={() => setShowForm(true)}
                disabled={disabled}
                className="w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 
                    rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                </svg>
                Add Task
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-slate-50 rounded-lg">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                disabled={isSubmitting}
                maxLength={200}
                autoFocus
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                    focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400
                    placeholder-gray-400"
            />

            <div className="flex gap-2 flex-wrap">
                {SUGGESTED_CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors
                            ${category === cat
                                ? 'bg-indigo-500 text-white'
                                : 'bg-white border border-slate-200 text-gray-600 hover:border-indigo-300'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Or type custom category..."
                disabled={isSubmitting}
                maxLength={50}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                    focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400
                    placeholder-gray-400"
            />

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!title.trim() || !category.trim() || isSubmitting}
                    className="flex-1 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg
                        hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                        transition-colors"
                >
                    {isSubmitting ? '...' : 'Add Task'}
                </button>
                <button
                    type="button"
                    onClick={() => { setShowForm(false); setTitle(''); setCategory(''); }}
                    className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
