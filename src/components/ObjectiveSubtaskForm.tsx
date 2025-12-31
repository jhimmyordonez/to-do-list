import { useState } from 'react';

interface ObjectiveSubtaskFormProps {
    onAdd: (title: string, phaseOrder: number, durationDays: number) => Promise<void>;
    existingPhases: number[];
    disabled?: boolean;
}

export function ObjectiveSubtaskForm({ onAdd, existingPhases, disabled }: ObjectiveSubtaskFormProps) {
    const [title, setTitle] = useState('');
    const [phaseOrder, setPhaseOrder] = useState(1);
    const [durationDays, setDurationDays] = useState(7);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Suggest next phase order
    const maxPhase = existingPhases.length > 0 ? Math.max(...existingPhases) : 0;
    const suggestedPhases = Array.from({ length: maxPhase + 2 }, (_, i) => i + 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || durationDays < 1 || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAdd(title.trim(), phaseOrder, durationDays);
            setTitle('');
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
                className="text-xs text-indigo-500 hover:text-indigo-600 
                    hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
            >
                + Subtask
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-2 p-3 bg-slate-50 rounded-lg space-y-3">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Subtask title..."
                disabled={isSubmitting}
                maxLength={200}
                autoFocus
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                    focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
            />

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Phase Order</label>
                    <div className="flex gap-1 flex-wrap">
                        {suggestedPhases.map((phase) => (
                            <button
                                key={phase}
                                type="button"
                                onClick={() => setPhaseOrder(phase)}
                                className={`w-8 h-8 text-sm rounded-lg transition-colors
                                    ${phaseOrder === phase
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-white border border-slate-200 text-gray-600 hover:border-indigo-300'
                                    }`}
                            >
                                {phase}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-24">
                    <label className="block text-xs text-gray-500 mb-1">Duration (days)</label>
                    <input
                        type="number"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        max={365}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                            focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!title.trim() || durationDays < 1 || isSubmitting}
                    className="flex-1 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg
                        hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? '...' : 'Add Subtask'}
                </button>
                <button
                    type="button"
                    onClick={() => { setShowForm(false); setTitle(''); }}
                    className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
