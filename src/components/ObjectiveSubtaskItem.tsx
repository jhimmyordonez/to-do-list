import type { ObjectiveSubtask } from '../types/objective';

interface ObjectiveSubtaskItemProps {
    subtask: ObjectiveSubtask;
    taskTitle: string;
    taskCategory: string;
    objectiveTitle: string;
    completed: boolean;
    onToggle: (subtaskId: string, completed: boolean) => Promise<void>;
    disabled?: boolean;
}

export function ObjectiveSubtaskItem({
    subtask,
    taskTitle,
    taskCategory,
    objectiveTitle,
    completed,
    onToggle,
    disabled
}: ObjectiveSubtaskItemProps) {
    const handleToggle = async () => {
        await onToggle(subtask.id, !completed);
    };

    return (
        <div
            className={`flex items-start bg-white rounded-xl border transition-all duration-200
                ${completed ? 'bg-slate-50 border-slate-200' : 'border-indigo-200 hover:border-indigo-300 hover:shadow-md'}
                shadow-sm gap-4 p-5`}
        >
            {/* Checkbox */}
            <button
                onClick={handleToggle}
                disabled={disabled}
                className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    ${completed
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'border-indigo-300 hover:border-indigo-400'}`}
                aria-label={completed ? 'Mark as pending' : 'Mark as completed'}
            >
                {completed && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            {/* Content */}
            <div className="flex-grow min-w-0 space-y-1">
                <span className={`block text-gray-800 font-medium transition-all duration-200 leading-relaxed
                    ${completed ? 'line-through text-gray-400' : ''}`}>
                    {subtask.title}
                </span>

                {/* Context info */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                        🎯 {objectiveTitle}
                    </span>
                    <span>
                        Category: <span className="font-medium text-gray-700">{taskCategory}</span>
                    </span>
                    <span>
                        Task: <span className="font-medium text-gray-700">{taskTitle}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
