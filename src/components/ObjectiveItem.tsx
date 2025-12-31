import { useState } from 'react';
import type { Objective, ObjectiveTask } from '../types/objective';
import { ObjectiveTaskForm } from './ObjectiveTaskForm';
import { ObjectiveSubtaskForm } from './ObjectiveSubtaskForm';
import { calculateObjectiveDuration } from '../lib/objectiveService';

interface ObjectiveItemProps {
    objective: Objective;
    onAddTask: (objectiveId: string, title: string, category: string) => Promise<void>;
    onAddSubtask: (taskId: string, title: string, phaseOrder: number, durationDays: number) => Promise<void>;
    onDelete: (objectiveId: string) => Promise<void>;
    disabled?: boolean;
}

export function ObjectiveItem({
    objective,
    onAddTask,
    onAddSubtask,
    onDelete,
    disabled
}: ObjectiveItemProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    const duration = calculateObjectiveDuration(objective);
    const daysElapsed = objective.days_elapsed || 0;
    const progress = duration > 0 ? Math.min(100, (daysElapsed / duration) * 100) : 0;

    // Group tasks by category
    const tasksByCategory = (objective.tasks || []).reduce((acc, task) => {
        if (!acc[task.category]) {
            acc[task.category] = [];
        }
        acc[task.category].push(task);
        return acc;
    }, {} as Record<string, ObjectiveTask[]>);

    const toggleTask = (taskId: string) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    const handleAddTask = async (title: string, category: string) => {
        await onAddTask(objective.id, title, category);
    };

    const handleAddSubtask = async (taskId: string, title: string, phaseOrder: number, durationDays: number) => {
        await onAddSubtask(taskId, title, phaseOrder, durationDays);
    };

    const handleDelete = async () => {
        if (window.confirm('Delete this objective and all its tasks?')) {
            await onDelete(objective.id);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div
                className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start gap-4">
                    {/* Expand/Collapse */}
                    <button className="mt-1 text-gray-400">
                        <svg
                            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-800">{objective.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Duration: {duration} days</span>
                            <span>Day {daysElapsed} of {duration}</span>
                            <span>Started: {new Date(objective.start_date).toLocaleDateString()}</span>
                        </div>

                        {/* Progress Bar */}
                        {duration > 0 && (
                            <div className="mt-3">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Delete button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                        disabled={disabled}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Delete objective"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-100 p-5 pt-4 space-y-4">
                    {/* Tasks grouped by category */}
                    {Object.entries(tasksByCategory).map(([category, tasks]) => (
                        <div key={category} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">Category:</span>
                                <span className="text-sm font-semibold text-indigo-600">{category}</span>
                            </div>

                            {tasks.map((task) => (
                                <div key={task.id} className="ml-4 border-l-2 border-indigo-200 pl-4">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg -ml-2"
                                        onClick={() => toggleTask(task.id)}
                                    >
                                        <svg
                                            className={`w-4 h-4 text-gray-400 transform transition-transform ${expandedTasks.has(task.id) ? 'rotate-90' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="font-medium text-gray-800">{task.title}</span>
                                        <span className="text-xs text-gray-400">
                                            ({task.subtasks?.length || 0} subtasks)
                                        </span>
                                    </div>

                                    {/* Subtasks */}
                                    {expandedTasks.has(task.id) && (
                                        <div className="ml-6 mt-2 space-y-2">
                                            {/* Group subtasks by phase */}
                                            {(() => {
                                                const phases = new Map<number, typeof task.subtasks>();
                                                (task.subtasks || []).forEach(st => {
                                                    if (!phases.has(st.phase_order)) {
                                                        phases.set(st.phase_order, []);
                                                    }
                                                    phases.get(st.phase_order)!.push(st);
                                                });

                                                return Array.from(phases.entries())
                                                    .sort(([a], [b]) => a - b)
                                                    .map(([phase, subtasks]) => (
                                                        <div key={phase} className="space-y-1">
                                                            <div className="text-xs font-medium text-gray-400">
                                                                Phase {phase}
                                                            </div>
                                                            {subtasks?.map(st => (
                                                                <div
                                                                    key={st.id}
                                                                    className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg"
                                                                >
                                                                    <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 text-xs font-bold rounded">
                                                                        {st.phase_order}
                                                                    </span>
                                                                    <span className="flex-1 text-gray-700">{st.title}</span>
                                                                    <span className="text-xs text-gray-400">
                                                                        {st.duration_days} days
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ));
                                            })()}

                                            {/* Add subtask form */}
                                            <ObjectiveSubtaskForm
                                                onAdd={(title, phase, days) => handleAddSubtask(task.id, title, phase, days)}
                                                existingPhases={(task.subtasks || []).map(s => s.phase_order)}
                                                disabled={disabled}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Add Task Form */}
                    <ObjectiveTaskForm onAdd={handleAddTask} disabled={disabled} />
                </div>
            )}
        </div>
    );
}
