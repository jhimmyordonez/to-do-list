import { useState } from 'react';
import { todayInLimaISO } from '../lib/todayLima';

interface ObjectiveFormProps {
    onAdd: (title: string, startDate: string) => Promise<void>;
    disabled?: boolean;
}

export function ObjectiveForm({ onAdd, disabled }: ObjectiveFormProps) {
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAdd(title.trim(), todayInLimaISO());
            setTitle('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="New objective..."
                    disabled={disabled || isSubmitting}
                    maxLength={200}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl
                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                        placeholder-gray-400 disabled:bg-gray-50
                        transition-all duration-200"
                />
                <button
                    type="submit"
                    disabled={!title.trim() || disabled || isSubmitting}
                    className="px-6 py-3 bg-indigo-500 text-white font-medium rounded-xl
                        hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                        transition-colors duration-200"
                >
                    {isSubmitting ? '...' : 'Add'}
                </button>
            </div>
        </form>
    );
}
