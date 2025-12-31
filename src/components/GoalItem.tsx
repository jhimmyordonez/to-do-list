import { useState } from 'react';
import type { Goal } from '../types/goal';

interface GoalItemProps {
    goal: Goal;
    onToggle: (id: string, done: boolean) => Promise<void>;
    onUpdate: (id: string, title: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onAddSubgoal?: (parentId: string, title: string) => Promise<void>;
    disabled?: boolean;
    isSubgoal?: boolean;
}

export function GoalItem({
    goal,
    onToggle,
    onUpdate,
    onDelete,
    onAddSubgoal,
    disabled,
    isSubgoal = false
}: GoalItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(goal.title);
    const [isOperating, setIsOperating] = useState(false);
    const [showAddSubgoal, setShowAddSubgoal] = useState(false);
    const [subgoalTitle, setSubgoalTitle] = useState('');

    const hasSubgoals = goal.subgoals && goal.subgoals.length > 0;

    // Calculate completion based on subgoals
    const subgoalsCompleted = hasSubgoals
        ? goal.subgoals!.filter(s => s.done).length
        : 0;
    const totalSubgoals = hasSubgoals ? goal.subgoals!.length : 0;
    const allSubgoalsDone = hasSubgoals && subgoalsCompleted === totalSubgoals;

    // Parent with subgoals is "done" only when all subgoals are done
    const effectiveDone = hasSubgoals ? allSubgoalsDone : goal.done;

    const handleToggle = async () => {
        // If has subgoals, don't allow manual toggle
        if (hasSubgoals || disabled || isOperating) return;

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
        const message = hasSubgoals
            ? 'Are you sure you want to delete this goal and all its sub-goals?'
            : 'Are you sure you want to delete this goal?';
        if (!window.confirm(message)) return;

        setIsOperating(true);
        try {
            await onDelete(goal.id);
        } finally {
            setIsOperating(false);
        }
    };

    const handleAddSubgoal = async () => {
        const trimmed = subgoalTitle.trim();
        if (!trimmed || !onAddSubgoal) return;

        setIsOperating(true);
        try {
            await onAddSubgoal(goal.id, trimmed);
            setSubgoalTitle('');
            setShowAddSubgoal(false);
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

    const handleSubgoalKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddSubgoal();
        } else if (e.key === 'Escape') {
            setShowAddSubgoal(false);
            setSubgoalTitle('');
        }
    };

    const isDisabled = disabled || isOperating;

    return (
        <div className={isSubgoal ? '' : 'space-y-3'}>
            <div
                className={`group bg-white rounded-xl shadow-sm border transition-all duration-200
                    ${isSubgoal
                        ? 'ml-10 border-l-2 border-l-indigo-300 rounded-l-none p-3 py-2.5'
                        : 'p-5'}
                    ${effectiveDone
                        ? 'bg-slate-50 border-slate-200'
                        : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
            >
                <div className="flex items-start gap-4">
                    {/* Checkbox - only shown for items WITHOUT subgoals */}
                    {!hasSubgoals && (
                        <button
                            onClick={handleToggle}
                            disabled={isDisabled}
                            className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center
                                transition-all duration-200 flex-shrink-0
                                ${goal.done
                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                    : 'border-slate-300 hover:border-indigo-400'
                                }
                                ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            title="Toggle completion"
                        >
                            {goal.done && (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    )}

                    {/* Progress indicator for goals with subgoals - no circle */}
                    {hasSubgoals && (
                        <div className="mt-0.5 w-8 h-8 flex items-center justify-center flex-shrink-0 bg-indigo-50 rounded-lg">
                            <span className={`text-xs font-semibold ${effectiveDone ? 'text-indigo-600' : 'text-indigo-400'}`}>
                                {subgoalsCompleted}/{totalSubgoals}
                            </span>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                disabled={isOperating}
                                className="w-full px-2 py-1 border border-indigo-300 rounded-lg
                                   focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                   disabled:bg-gray-100"
                            />
                        ) : (
                            <div className="flex flex-col gap-1">
                                <p
                                    className={`text-gray-800 font-medium transition-all duration-200 leading-relaxed
                                        ${effectiveDone ? 'line-through text-gray-400' : ''}`}
                                >
                                    {goal.title}
                                </p>
                                {hasSubgoals && (
                                    <p className="text-sm text-gray-500">
                                        {subgoalsCompleted} of {totalSubgoals} sub-goals completed
                                    </p>
                                )}
                                {goal.completed_at && (
                                    <p className="text-sm text-indigo-600">
                                        Completed {new Date(goal.completed_at).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Add sub-goal button (only for main goals, not sub-goals) */}
                            {!isSubgoal && onAddSubgoal && (
                                <button
                                    onClick={() => setShowAddSubgoal(!showAddSubgoal)}
                                    disabled={isDisabled}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50
                                       rounded-lg transition-all duration-200
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Add sub-goal"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={() => setIsEditing(true)}
                                disabled={isDisabled}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50
                                   rounded-lg transition-all duration-200
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit goal"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDisabled}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50
                                   rounded-lg transition-all duration-200
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete goal"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Add sub-goal form */}
                {showAddSubgoal && (
                    <div className="mt-4 ml-12 flex gap-2">
                        <input
                            type="text"
                            value={subgoalTitle}
                            onChange={(e) => setSubgoalTitle(e.target.value)}
                            onKeyDown={handleSubgoalKeyDown}
                            placeholder="Add a sub-goal..."
                            autoFocus
                            disabled={isOperating}
                            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg
                               focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300
                               disabled:bg-gray-50"
                        />
                        <button
                            onClick={handleAddSubgoal}
                            disabled={isOperating || !subgoalTitle.trim()}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-lg
                               hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                               transition-colors duration-200"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => { setShowAddSubgoal(false); setSubgoalTitle(''); }}
                            className="px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg
                               transition-colors duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Render sub-goals */}
            {hasSubgoals && (
                <div className="space-y-2">
                    {goal.subgoals!.map((subgoal) => (
                        <GoalItem
                            key={subgoal.id}
                            goal={subgoal}
                            onToggle={onToggle}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            disabled={disabled}
                            isSubgoal={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
