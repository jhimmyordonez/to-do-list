import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { fetchObjectivesWithDetails, calculateObjectiveDuration } from '../lib/objectiveService';
import type { Objective } from '../types/objective';
import { todayInLimaISO } from '../lib/todayLima';

// Suggested categories
const CATEGORIES = ['Vocabulary', 'Grammar', 'Reading', 'Writing', 'Listening', 'Speaking', 'Practice', 'Review'];

export function GoalsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOperating, setIsOperating] = useState(false);

    // Forms state
    const [showObjectiveForm, setShowObjectiveForm] = useState(false);
    const [newObjectiveTitle, setNewObjectiveTitle] = useState('');
    const [expandedObjective, setExpandedObjective] = useState<string | null>(null);
    const [expandedTask, setExpandedTask] = useState<string | null>(null);

    // Task form
    const [showTaskForm, setShowTaskForm] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState('');

    // Subtask form
    const [showSubtaskForm, setShowSubtaskForm] = useState<string | null>(null);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newSubtaskPhase, setNewSubtaskPhase] = useState(1);
    const [newSubtaskDays, setNewSubtaskDays] = useState(7);

    const fetchData = useCallback(async () => {
        if (!isSupabaseConfigured || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await fetchObjectivesWithDetails(user.id);
            setObjectives(data);
        } catch (err) {
            console.error('Error fetching objectives:', err);
            setError('Error loading objectives.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddObjective = async () => {
        if (!user || !newObjectiveTitle.trim()) return;
        setIsOperating(true);

        try {
            const { data, error: insertError } = await supabase
                .from('objectives')
                .insert({
                    title: newObjectiveTitle.trim(),
                    start_date: todayInLimaISO(),
                    user_id: user.id
                })
                .select()
                .single();

            if (insertError) throw insertError;

            if (data) {
                setObjectives(prev => [{
                    ...data,
                    tasks: [],
                    calculated_duration: 0,
                    days_elapsed: 0
                }, ...prev]);
                setNewObjectiveTitle('');
                setShowObjectiveForm(false);
                setExpandedObjective(data.id);
            }
        } catch (err) {
            console.error('Error adding objective:', err);
            setError('Error adding objective.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleAddTask = async (objectiveId: string) => {
        if (!newTaskTitle.trim() || !newTaskCategory.trim()) return;
        setIsOperating(true);

        try {
            const { data, error: insertError } = await supabase
                .from('objective_tasks')
                .insert({
                    objective_id: objectiveId,
                    title: newTaskTitle.trim(),
                    category: newTaskCategory.trim()
                })
                .select()
                .single();

            if (insertError) throw insertError;

            if (data) {
                setObjectives(prev => prev.map(obj => {
                    if (obj.id === objectiveId) {
                        return {
                            ...obj,
                            tasks: [...(obj.tasks || []), { ...data, subtasks: [] }]
                        };
                    }
                    return obj;
                }));
                setNewTaskTitle('');
                setNewTaskCategory('');
                setShowTaskForm(null);
                setExpandedTask(data.id);
            }
        } catch (err) {
            console.error('Error adding task:', err);
            setError('Error adding task.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleAddSubtask = async (taskId: string) => {
        if (!newSubtaskTitle.trim() || newSubtaskDays < 1) return;
        setIsOperating(true);

        try {
            const { data, error: insertError } = await supabase
                .from('objective_subtasks')
                .insert({
                    task_id: taskId,
                    title: newSubtaskTitle.trim(),
                    phase_order: newSubtaskPhase,
                    duration_days: newSubtaskDays
                })
                .select()
                .single();

            if (insertError) throw insertError;

            if (data) {
                await fetchData(); // Refresh to recalculate durations
                setNewSubtaskTitle('');
                setNewSubtaskPhase(1);
                setNewSubtaskDays(7);
                setShowSubtaskForm(null);
            }
        } catch (err) {
            console.error('Error adding subtask:', err);
            setError('Error adding subtask.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleDeleteObjective = async (id: string) => {
        if (!confirm('Delete this objective and all its tasks?')) return;
        setIsOperating(true);

        try {
            await supabase.from('objectives').delete().eq('id', id);
            setObjectives(prev => prev.filter(o => o.id !== id));
        } catch (err) {
            console.error('Error deleting objective:', err);
        } finally {
            setIsOperating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <nav className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/todos')}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-xl font-bold text-slate-800">Goal Planning</h1>
                        </div>

                        <button
                            onClick={() => navigate('/todos')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 
                                bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <span>📋</span>
                            <span>Daily Tasks</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Add Objective Button */}
                <div className="mb-8">
                    {!showObjectiveForm ? (
                        <button
                            onClick={() => setShowObjectiveForm(true)}
                            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl
                                text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50
                                transition-all duration-200 font-medium"
                        >
                            + Create New Objective
                        </button>
                    ) : (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">New Objective</h3>
                            <input
                                type="text"
                                value={newObjectiveTitle}
                                onChange={(e) => setNewObjectiveTitle(e.target.value)}
                                placeholder="What do you want to achieve?"
                                autoFocus
                                maxLength={200}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-4
                                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddObjective}
                                    disabled={!newObjectiveTitle.trim() || isOperating}
                                    className="flex-1 py-2.5 bg-indigo-500 text-white font-medium rounded-lg
                                        hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    Create Objective
                                </button>
                                <button
                                    onClick={() => { setShowObjectiveForm(false); setNewObjectiveTitle(''); }}
                                    className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col items-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                        <p className="text-slate-500">Loading...</p>
                    </div>
                ) : objectives.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl">🎯</span>
                        </div>
                        <p className="text-slate-600 mb-2">No objectives yet</p>
                        <p className="text-sm text-slate-400">Create your first objective to start planning</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {objectives.map((objective) => {
                            const duration = calculateObjectiveDuration(objective);
                            const isExpanded = expandedObjective === objective.id;

                            return (
                                <div key={objective.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    {/* Objective Header */}
                                    <div
                                        className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={() => setExpandedObjective(isExpanded ? null : objective.id)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2 rounded-lg transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-slate-800">{objective.title}</h3>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                                    <span>{duration} days total</span>
                                                    <span>•</span>
                                                    <span>{(objective.tasks || []).length} tasks</span>
                                                    <span>•</span>
                                                    <span>Started {new Date(objective.start_date).toLocaleDateString()}</span>
                                                </div>

                                                {/* Progress bar */}
                                                {duration > 0 && (
                                                    <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 transition-all"
                                                            style={{ width: `${Math.min(100, ((objective.days_elapsed || 0) / duration) * 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteObjective(objective.id); }}
                                                className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 p-5 bg-slate-50">
                                            {/* Tasks */}
                                            <div className="space-y-3">
                                                {(objective.tasks || []).map((task) => {
                                                    const isTaskExpanded = expandedTask === task.id;
                                                    const phases = [...new Set((task.subtasks || []).map(s => s.phase_order))].sort((a, b) => a - b);

                                                    return (
                                                        <div key={task.id} className="bg-white rounded-lg border border-slate-200">
                                                            {/* Task Header */}
                                                            <div
                                                                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                                                onClick={() => setExpandedTask(isTaskExpanded ? null : task.id)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-1.5 h-8 bg-indigo-400 rounded-full"></div>
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-slate-700">{task.title}</p>
                                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                                            {task.category} • {(task.subtasks || []).length} subtasks
                                                                        </p>
                                                                    </div>
                                                                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${isTaskExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>

                                                            {/* Subtasks */}
                                                            {isTaskExpanded && (
                                                                <div className="border-t border-slate-100 p-4 bg-slate-50">
                                                                    {phases.map((phase) => {
                                                                        const phaseSubtasks = (task.subtasks || []).filter(s => s.phase_order === phase);
                                                                        return (
                                                                            <div key={phase} className="mb-4 last:mb-0">
                                                                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                                                                                    Phase {phase}
                                                                                </p>
                                                                                <div className="space-y-2">
                                                                                    {phaseSubtasks.map((subtask) => (
                                                                                        <div key={subtask.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                                                                                            <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 text-xs font-bold rounded">
                                                                                                {subtask.phase_order}
                                                                                            </span>
                                                                                            <span className="flex-1 text-sm text-slate-700">{subtask.title}</span>
                                                                                            <span className="text-xs text-slate-400">{subtask.duration_days}d</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}

                                                                    {/* Add Subtask Form */}
                                                                    {showSubtaskForm === task.id ? (
                                                                        <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                                                                            <input
                                                                                type="text"
                                                                                value={newSubtaskTitle}
                                                                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                                                placeholder="Subtask title..."
                                                                                autoFocus
                                                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mb-3
                                                                                    focus:ring-1 focus:ring-indigo-400"
                                                                            />
                                                                            <div className="flex gap-4 mb-3">
                                                                                <div className="flex-1">
                                                                                    <label className="text-xs text-slate-500 mb-1 block">Phase</label>
                                                                                    <div className="flex gap-1">
                                                                                        {[1, 2, 3, 4, 5].map(p => (
                                                                                            <button
                                                                                                key={p}
                                                                                                type="button"
                                                                                                onClick={() => setNewSubtaskPhase(p)}
                                                                                                className={`w-8 h-8 text-sm rounded-lg transition-colors
                                                                                                    ${newSubtaskPhase === p
                                                                                                        ? 'bg-indigo-500 text-white'
                                                                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                                                    }`}
                                                                                            >
                                                                                                {p}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="w-24">
                                                                                    <label className="text-xs text-slate-500 mb-1 block">Days</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={newSubtaskDays}
                                                                                        onChange={(e) => setNewSubtaskDays(Math.max(1, parseInt(e.target.value) || 1))}
                                                                                        min={1}
                                                                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => handleAddSubtask(task.id)}
                                                                                    disabled={!newSubtaskTitle.trim() || isOperating}
                                                                                    className="flex-1 py-2 text-sm bg-indigo-500 text-white rounded-lg
                                                                                        hover:bg-indigo-600 disabled:bg-slate-300 transition-colors"
                                                                                >
                                                                                    Add
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setShowSubtaskForm(null)}
                                                                                    className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => setShowSubtaskForm(task.id)}
                                                                            className="mt-3 w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                        >
                                                                            + Add Subtask
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Add Task Form */}
                                            {showTaskForm === objective.id ? (
                                                <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                                                    <input
                                                        type="text"
                                                        value={newTaskTitle}
                                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                                        placeholder="Task title..."
                                                        autoFocus
                                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mb-3
                                                            focus:ring-1 focus:ring-indigo-400"
                                                    />
                                                    <div className="mb-3">
                                                        <p className="text-xs text-slate-500 mb-2">Category</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {CATEGORIES.map(cat => (
                                                                <button
                                                                    key={cat}
                                                                    type="button"
                                                                    onClick={() => setNewTaskCategory(cat)}
                                                                    className={`px-3 py-1.5 text-xs rounded-full transition-colors
                                                                        ${newTaskCategory === cat
                                                                            ? 'bg-indigo-500 text-white'
                                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                        }`}
                                                                >
                                                                    {cat}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAddTask(objective.id)}
                                                            disabled={!newTaskTitle.trim() || !newTaskCategory.trim() || isOperating}
                                                            className="flex-1 py-2 text-sm bg-indigo-500 text-white rounded-lg
                                                                hover:bg-indigo-600 disabled:bg-slate-300 transition-colors"
                                                        >
                                                            Add Task
                                                        </button>
                                                        <button
                                                            onClick={() => { setShowTaskForm(null); setNewTaskTitle(''); setNewTaskCategory(''); }}
                                                            className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowTaskForm(objective.id)}
                                                    className="mt-4 w-full py-3 border border-dashed border-slate-300 rounded-lg
                                                        text-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-300 
                                                        hover:bg-white transition-all"
                                                >
                                                    + Add Task
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
