import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface RecurringTask {
    template_id: string;
    title: string;
    category: string;
    repeat_days: number;
    repeat_start_date: string;
    completed_count: number;
    total_count: number;
    is_complete: boolean;
}

interface CategoryGroup {
    category: string;
    tasks: RecurringTask[];
}

// Get the first day of a month in YYYY-MM-DD format
function getMonthStart(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

// Get the last day of a month in YYYY-MM-DD format
function getMonthEnd(date: Date): string {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
}

// Format month for display (e.g., "January 2025")
function formatMonthForDisplay(monthStr: string): string {
    const date = new Date(monthStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Get previous month
function getPrevMonth(monthStr: string): string {
    const date = new Date(monthStr + 'T12:00:00');
    date.setMonth(date.getMonth() - 1);
    return getMonthStart(date);
}

// Get next month
function getNextMonth(monthStr: string): string {
    const date = new Date(monthStr + 'T12:00:00');
    date.setMonth(date.getMonth() + 1);
    return getMonthStart(date);
}

export function GoalsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(getMonthStart(new Date()));

    const currentMonth = getMonthStart(new Date());
    const isCurrentMonth = selectedMonth === currentMonth;
    const isFutureMonth = selectedMonth > currentMonth;

    const fetchRecurringTasks = useCallback(async () => {
        if (!isSupabaseConfigured || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const monthStart = selectedMonth;
            const monthEnd = getMonthEnd(new Date(selectedMonth + 'T12:00:00'));

            // Fetch ALL tasks for this month (including subtasks) to calculate effective completion
            const { data, error: fetchError } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', user.id)
                .gte('task_date', monthStart)
                .lte('task_date', monthEnd)
                .order('category', { ascending: true })
                .order('title', { ascending: true });

            if (fetchError) {
                throw fetchError;
            }

            const allTasks = data || [];

            // Separate main tasks and subtasks
            const mainTasks = allTasks.filter((t: { parent_id: string | null }) => !t.parent_id);
            const subtasks = allTasks.filter((t: { parent_id: string | null }) => t.parent_id);

            // Create a map of parent_id -> subtasks
            const subtaskMap = new Map<string, { done: boolean }[]>();
            subtasks.forEach((st: { parent_id: string; done: boolean }) => {
                if (!subtaskMap.has(st.parent_id)) {
                    subtaskMap.set(st.parent_id, []);
                }
                subtaskMap.get(st.parent_id)!.push({ done: st.done });
            });

            // Group by template_id and calculate progress
            const templateMap = new Map<string, {
                template_id: string;
                title: string;
                category: string;
                repeat_days: number;
                repeat_start_date: string;
                tasks: { effectiveDone: boolean; task_date: string }[];
            }>();

            mainTasks.forEach((task: {
                id: string;
                template_id: string | null;
                title: string;
                category: string;
                repeat_days: number;
                repeat_start_date: string;
                done: boolean;
                task_date: string;
            }) => {
                // Skip tasks without template_id (non-recurring)
                if (!task.template_id) return;

                // Calculate effective done status
                const taskSubtasks = subtaskMap.get(task.id) || [];
                const hasSubtasks = taskSubtasks.length > 0;
                const allSubtasksDone = hasSubtasks && taskSubtasks.every(st => st.done);
                const effectiveDone = hasSubtasks ? allSubtasksDone : task.done;

                if (!templateMap.has(task.template_id)) {
                    templateMap.set(task.template_id, {
                        template_id: task.template_id,
                        title: task.title,
                        category: task.category || 'Uncategorized',
                        repeat_days: task.repeat_days,
                        repeat_start_date: task.repeat_start_date,
                        tasks: []
                    });
                }
                templateMap.get(task.template_id)!.tasks.push({
                    effectiveDone: effectiveDone,
                    task_date: task.task_date
                });
            });

            // Convert to array and calculate completion
            const recurringTasks: RecurringTask[] = [];
            templateMap.forEach((value) => {
                const completedCount = value.tasks.filter(t => t.effectiveDone).length;
                const totalCount = value.tasks.length;

                recurringTasks.push({
                    template_id: value.template_id,
                    title: value.title,
                    category: value.category,
                    repeat_days: value.repeat_days,
                    repeat_start_date: value.repeat_start_date,
                    completed_count: completedCount,
                    total_count: totalCount,
                    is_complete: completedCount === totalCount && totalCount > 0
                });
            });

            // Group by category
            const categoryMap = new Map<string, RecurringTask[]>();
            recurringTasks.forEach((task) => {
                if (!categoryMap.has(task.category)) {
                    categoryMap.set(task.category, []);
                }
                categoryMap.get(task.category)!.push(task);
            });

            // Convert to array and sort
            const groups: CategoryGroup[] = [];
            categoryMap.forEach((tasks, category) => {
                groups.push({ category, tasks });
            });
            groups.sort((a, b) => a.category.localeCompare(b.category));

            setCategoryGroups(groups);
        } catch (err) {
            console.error('Error fetching recurring tasks:', err);
            setError('Error loading goals. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user, selectedMonth]);

    useEffect(() => {
        fetchRecurringTasks();
    }, [fetchRecurringTasks]);

    const totalTasks = categoryGroups.reduce((acc, g) => acc + g.tasks.length, 0);
    const completedTasks = categoryGroups.reduce(
        (acc, g) => acc + g.tasks.filter(t => t.is_complete).length,
        0
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/todos')}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Back to daily tasks"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-2xl">🎯</span>
                            <h1 className="text-xl font-bold text-gray-900">Monthly Goals</h1>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                Read-only
                            </span>
                        </div>

                        <button
                            onClick={() => navigate('/todos')}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                               hover:bg-gray-200 rounded-lg transition-colors duration-200
                               flex items-center gap-2"
                        >
                            <span>✅</span>
                            <span>Daily Tasks</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Info banner */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Goals are automatically generated</strong> from recurring tasks.
                        Add tasks with a category and number of days in the Daily Tasks view.
                    </p>
                </div>

                {/* Month Navigation */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {formatMonthForDisplay(selectedMonth)}
                            </h2>
                            <p className="text-gray-600 mt-1">
                                {isCurrentMonth
                                    ? 'Current month progress'
                                    : isFutureMonth
                                        ? 'Future month goals'
                                        : 'Past month results'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                                   rounded-lg transition-colors"
                                title="Previous month"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {!isCurrentMonth && (
                                <button
                                    onClick={() => setSelectedMonth(currentMonth)}
                                    className="px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50
                                       hover:bg-emerald-100 rounded-lg transition-colors duration-200"
                                >
                                    Current Month
                                </button>
                            )}

                            {!isFutureMonth && (
                                <button
                                    onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 
                                       rounded-lg transition-colors"
                                    title="Next month"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {totalTasks > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Overall progress</span>
                                <span>{completedTasks} of {totalTasks} goals achieved</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                    style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Goals List by Category */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent mb-4"></div>
                        <p className="text-gray-600">Loading goals...</p>
                    </div>
                ) : categoryGroups.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <span className="text-3xl">🎯</span>
                        </div>
                        <p className="text-gray-600 mb-4">
                            No recurring tasks for this month yet.
                        </p>
                        <button
                            onClick={() => navigate('/todos')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Add Tasks →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {categoryGroups.map((group) => (
                            <div key={group.category} className="space-y-3">
                                {/* Category Header */}
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">📁</span>
                                    <h3 className="text-lg font-semibold text-gray-900">{group.category}</h3>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                        {group.tasks.filter(t => t.is_complete).length}/{group.tasks.length}
                                    </span>
                                </div>

                                {/* Tasks in category */}
                                {group.tasks.map((task) => (
                                    <div
                                        key={task.template_id}
                                        className={`bg-white rounded-xl shadow-sm border p-4 transition-all duration-200
                                            ${task.is_complete
                                                ? 'border-emerald-200 bg-emerald-50/50'
                                                : 'border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Progress indicator */}
                                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                                                <span className={`text-sm font-bold ${task.is_complete ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                    {task.completed_count}/{task.total_count}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-gray-900 font-medium ${task.is_complete ? 'line-through text-gray-500' : ''}`}>
                                                    {task.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {task.repeat_days} day goal • Started {new Date(task.repeat_start_date).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {/* Status badge */}
                                            <div className="flex-shrink-0">
                                                {task.is_complete ? (
                                                    <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                                        ✓ Complete
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                                        In Progress
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${task.is_complete
                                                    ? 'bg-emerald-500'
                                                    : 'bg-indigo-500'
                                                    }`}
                                                style={{ width: `${(task.completed_count / task.total_count) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Success Message */}
                {!loading && totalTasks > 0 && completedTasks === totalTasks && (
                    <div className="mt-8 text-center py-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                        <span className="text-4xl mb-2 block">🏆</span>
                        <p className="text-emerald-700 font-medium">
                            Amazing! You achieved all your goals for {formatMonthForDisplay(selectedMonth)}!
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
