import { useState } from 'react';
import type { Todo } from '../types/todo';

interface TodoItemProps {
    todo: Todo;
    onToggle: (id: string, done: boolean) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onUpdate: (id: string, title: string) => Promise<void>;
    onAddSubtask?: (parentId: string, title: string) => Promise<void>;
    disabled?: boolean;
    isSubtask?: boolean;
}

export function TodoItem({
    todo,
    onToggle,
    onDelete,
    onUpdate,
    onAddSubtask,
    disabled = false,
    isSubtask = false
}: TodoItemProps) {
    const [showSubtaskInput, setShowSubtaskInput] = useState(false);
    const [subtaskTitle, setSubtaskTitle] = useState('');
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(todo.title);
    const [isSaving, setIsSaving] = useState(false);

    // Check if this task has subtasks
    const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
    const subtaskCount = todo.subtasks?.length || 0;
    const completedSubtasks = todo.subtasks?.filter(s => s.done).length || 0;

    // Auto-calculate done status based on subtasks
    const isAutoCompleted = hasSubtasks && completedSubtasks === subtaskCount;
    const effectiveDone = hasSubtasks ? isAutoCompleted : todo.done;

    const handleToggle = async () => {
        // Don't allow manual toggle if has subtasks
        if (hasSubtasks) return;
        await onToggle(todo.id, !todo.done);
    };

    const handleDelete = async () => {
        await onDelete(todo.id);
    };

    const handleUpdate = async () => {
        const trimmedTitle = editTitle.trim();
        if (!trimmedTitle || trimmedTitle === todo.title) {
            setIsEditing(false);
            setEditTitle(todo.title);
            return;
        }

        setIsSaving(true);
        try {
            await onUpdate(todo.id, trimmedTitle);
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating task:', err);
            setEditTitle(todo.title);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSubtask = async () => {
        if (!subtaskTitle.trim() || !onAddSubtask) return;

        setIsAddingSubtask(true);
        try {
            await onAddSubtask(todo.id, subtaskTitle.trim());
            setSubtaskTitle('');
            setShowSubtaskInput(false);
        } finally {
            setIsAddingSubtask(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddSubtask();
        } else if (e.key === 'Escape') {
            setShowSubtaskInput(false);
            setSubtaskTitle('');
        }
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleUpdate();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditTitle(todo.title);
        }
    };

    return (
        <div className={isSubtask ? '' : 'space-y-3'}>
            <div
                className={`flex items-start bg-white rounded-xl border 
                    transition-all duration-200
                    ${effectiveDone ? 'bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}
                    ${isSubtask
                        ? 'ml-10 border-l-2 border-l-indigo-300 rounded-l-none gap-3 p-3 py-2.5'
                        : 'shadow-sm gap-4 p-5'}`}
            >
                {/* Checkbox / Status indicator */}
                {hasSubtasks ? (
                    // For tasks with subtasks: show only progress counter (no circle)
                    <div
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-50 rounded-lg mt-0.5"
                        title={isAutoCompleted ? 'All subtasks completed' : `${completedSubtasks}/${subtaskCount} subtasks`}
                    >
                        <span className={`text-xs font-semibold ${isAutoCompleted ? 'text-indigo-600' : 'text-indigo-400'}`}>
                            {completedSubtasks}/{subtaskCount}
                        </span>
                    </div>
                ) : (
                    // For tasks without subtasks: normal clickable checkbox
                    <button
                        onClick={handleToggle}
                        disabled={disabled || isSaving}
                        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5
                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       ${todo.done
                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                : 'border-slate-300 hover:border-indigo-400'}`}
                        aria-label={todo.done ? 'Mark as pending' : 'Mark as completed'}
                    >
                        {todo.done && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                )}

                <div className="flex-grow min-w-0 space-y-2">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            onBlur={handleUpdate}
                            disabled={isSaving}
                            maxLength={500}
                            autoFocus
                            className="w-full px-2 py-1 text-gray-800 border-b-2 border-gray-400 focus:outline-none focus:border-gray-600 bg-transparent"
                        />
                    ) : (
                        <span
                            onClick={(e) => {
                                if (disabled) return;

                                // Detect Ctrl/Cmd + Click to open links
                                if (e.ctrlKey || e.metaKey) {
                                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                                    const matches = todo.title.match(urlRegex);
                                    if (matches && matches.length > 0) {
                                        window.open(matches[0], '_blank', 'noopener,noreferrer');
                                        return;
                                    }
                                }

                                setIsEditing(true);
                            }}
                            title={(todo.title.match(/(https?:\/\/[^\s]+)/)) ? "Ctrl + Click to open link" : ""}
                            className={`block text-gray-800 font-medium transition-all duration-200 cursor-text leading-relaxed
                           ${effectiveDone ? 'line-through text-gray-400' : ''}`}
                        >
                            {todo.title}
                        </span>
                    )}
                    {hasSubtasks && (
                        <span className={`text-sm block ${isAutoCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                            {isAutoCompleted
                                ? 'All subtasks completed'
                                : `${completedSubtasks} of ${subtaskCount} subtasks completed`}
                        </span>
                    )}
                    {/* Category and repeat badges */}
                    {!isSubtask && (todo.category || todo.repeat_days > 0) && (
                        <div className="flex gap-3 flex-wrap">
                            {todo.category && (
                                <span className="text-xs text-gray-500">
                                    Category: <span className="text-gray-700 font-medium">{todo.category}</span>
                                </span>
                            )}
                            {todo.repeat_days > 0 && (
                                <span className="text-xs text-gray-500">
                                    Duration: <span className="text-gray-700 font-medium">{todo.repeat_days} days</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                    {/* Add subtask button - only for main tasks */}
                    {!isSubtask && onAddSubtask && (
                        <button
                            onClick={() => setShowSubtaskInput(!showSubtaskInput)}
                            disabled={disabled || isSaving}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 
                         rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Add subtask"
                            title="Add subtask"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                    )}

                    <button
                        onClick={handleDelete}
                        disabled={disabled || isSaving}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 
                       rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Delete task"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Subtask input */}
            {showSubtaskInput && (
                <div className="ml-10 flex gap-2 animate-fade-in">
                    <input
                        type="text"
                        value={subtaskTitle}
                        onChange={(e) => setSubtaskTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="New subtask..."
                        disabled={isAddingSubtask}
                        maxLength={500}
                        autoFocus
                        className="flex-grow px-4 py-2.5 text-sm border border-gray-200 rounded-lg 
                       focus:ring-1 focus:ring-gray-300 focus:border-gray-300 
                       placeholder-gray-400 disabled:bg-gray-50"
                    />
                    <button
                        onClick={handleAddSubtask}
                        disabled={isAddingSubtask || !subtaskTitle.trim()}
                        className="px-4 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-lg
                       hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                       transition-colors duration-200"
                    >
                        {isAddingSubtask ? '...' : 'Add'}
                    </button>
                    <button
                        onClick={() => {
                            setShowSubtaskInput(false);
                            setSubtaskTitle('');
                        }}
                        className="px-3 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Render subtasks */}
            {todo.subtasks && todo.subtasks.length > 0 && (
                <div className="space-y-2 mt-2">
                    {todo.subtasks.map((subtask) => (
                        <TodoItem
                            key={subtask.id}
                            todo={subtask}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            disabled={disabled}
                            isSubtask={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
