import { useState } from 'react';
import type { Goal } from '../types/goal';

interface GoalItemProps {
    goal: Goal;
    onToggle: (id: string, done: boolean) => Promise<void>;
    onUpdate: (id: string, title: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    disabled?: boolean;
}

export function GoalItem({ goal, onToggle, onUpdate, onDelete, disabled }: GoalItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(goal.title);
    const [isOperating, setIsOperating] = useState(false);

    const handleToggle = async () => {
        if (disabled || isOperating) return;
        setIsOperating(true);
        try {
            await onToggle(goal.id, !goal.done);
        } finally {
            setIsOperating(false);
        }
    };

    const handleSave = async () => {
        const trimmed = editTitle.trim();
        if (!trimmed || trimmed === goal.title) {
            setIsEditing(false);
            setEditTitle(goal.title);
            return;
        }

        setIsOperating(true);
        try {
            await onUpdate(goal.id, trimmed);
            setIsEditing(false);
        } finally {
            setIsOperating(false);
        }
    };

    const handleDelete = async () => {
        if (disabled || isOperating) return;
        if (!window.confirm('Are you sure you want to delete this goal?')) return;

        setIsOperating(true);
        try {
            await onDelete(goal.id);
        } finally {
            setIsOperating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditTitle(goal.title);
        }
    };

    const isDisabled = disabled || isOperating;

    return (
        <div
            className={`group bg-white rounded-xl shadow-sm border transition-all duration-200 p-4
                ${goal.done
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                }`}
        >
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                    onClick={handleToggle}
                    disabled={isDisabled}
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center
                        transition-all duration-200 flex-shrink-0
                        ${goal.done
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-gray-300 hover:border-emerald-500'
                        }
                        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                    {goal.done && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            disabled={isOperating}
                            className="w-full px-2 py-1 border border-emerald-300 rounded-lg
                               focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                               disabled:bg-gray-100"
                        />
                    ) : (
                        <div className="flex flex-col gap-1">
                            <p
                                className={`text-gray-900 transition-all duration-200
                                    ${goal.done ? 'line-through text-gray-500' : ''}`}
                            >
                                {goal.title}
                            </p>
                            {goal.completed_at && (
                                <p className="text-xs text-emerald-600">
                                    ✓ Completed {new Date(goal.completed_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={isDisabled}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50
                               rounded-lg transition-colors duration-200
                               disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit goal"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDisabled}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50
                               rounded-lg transition-colors duration-200
                               disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete goal"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
