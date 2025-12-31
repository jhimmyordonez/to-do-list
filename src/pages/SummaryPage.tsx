import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface TaskSummary {
    title: string;
    count: number;
    lastCompleted: string;
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

export function SummaryPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summaries, setSummaries] = useState<TaskSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(getMonthStart(new Date()));

    const currentMonth = getMonthStart(new Date());
    const isCurrentMonth = selectedMonth === currentMonth;
    const isFutureMonth = selectedMonth > currentMonth;

    const fetchSummary = useCallback(async () => {
        if (!isSupabaseConfigured || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const monthStart = selectedMonth;
            const monthEnd = getMonthEnd(new Date(selectedMonth + 'T12:00:00'));

            // Fetch all completed tasks for the selected month
            const { data, error: fetchError } = await supabase
                .from('todos')
                .select('title, task_date, done')
                .eq('user_id', user.id)
                .eq('done', true)
                .is('parent_id', null) // Only main tasks, not subtasks
                .gte('task_date', monthStart)
                .lte('task_date', monthEnd)
                .order('task_date', { ascending: false });

            if (fetchError) {
                throw fetchError;
            }

            // Group by title and count
            const titleCounts = new Map<string, { count: number; lastCompleted: string }>();

            (data || []).forEach((task: { title: string; task_date: string }) => {
                const normalizedTitle = task.title.trim().toLowerCase();
                const existing = titleCounts.get(normalizedTitle);

                if (existing) {
                    existing.count++;
                    if (task.task_date > existing.lastCompleted) {
                        existing.lastCompleted = task.task_date;
                    }
                } else {
                    titleCounts.set(normalizedTitle, {
                        count: 1,
                        lastCompleted: task.task_date
                    });
                }
            });

            // Convert to array and sort by count (descending)
            const summaryArray: TaskSummary[] = [];

            // Get original titles (with proper casing)
            const originalTitles = new Map<string, string>();
            (data || []).forEach((task: { title: string }) => {
                const normalizedTitle = task.title.trim().toLowerCase();
                if (!originalTitles.has(normalizedTitle)) {
                    originalTitles.set(normalizedTitle, task.title);
                }
            });

            titleCounts.forEach((value, key) => {
                summaryArray.push({
                    title: originalTitles.get(key) || key,
                    count: value.count,
                    lastCompleted: value.lastCompleted
                });
            });

            summaryArray.sort((a, b) => b.count - a.count);
            setSummaries(summaryArray);
        } catch (err) {
            console.error('Error fetching summary:', err);
            setError('Error loading summary. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user, selectedMonth]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const totalCompletedTasks = summaries.reduce((acc, s) => acc + s.count, 0);
    const uniqueTasks = summaries.length;

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
                            <span className="text-2xl">📊</span>
                            <h1 className="text-xl font-bold text-gray-900">Monthly Summary</h1>
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
                {/* Month Navigation */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {formatMonthForDisplay(selectedMonth)}
                            </h2>
                            <p className="text-gray-600 mt-1">
                                Task completion frequency
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
                                    className="px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50
                                       hover:bg-purple-100 rounded-lg transition-colors duration-200"
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

                    {/* Stats Cards */}
                    {!loading && summaries.length > 0 && (
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <p className="text-sm text-gray-600">Total Completed</p>
                                <p className="text-3xl font-bold text-purple-600">{totalCompletedTasks}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <p className="text-sm text-gray-600">Unique Tasks</p>
                                <p className="text-3xl font-bold text-indigo-600">{uniqueTasks}</p>
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

                {/* Summary List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent mb-4"></div>
                        <p className="text-gray-600">Loading summary...</p>
                    </div>
                ) : summaries.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <span className="text-3xl">📊</span>
                        </div>
                        <p className="text-gray-600">
                            {isFutureMonth
                                ? "No data for future months."
                                : "No completed tasks for this month yet."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {summaries.map((summary, index) => (
                            <div
                                key={`${summary.title}-${index}`}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 
                                    hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-900 font-medium truncate">
                                            {summary.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Last completed: {new Date(summary.lastCompleted).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className={`px-3 py-1.5 rounded-full font-bold text-sm
                                            ${summary.count >= 20
                                                ? 'bg-green-100 text-green-700'
                                                : summary.count >= 10
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : summary.count >= 5
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {summary.count}x
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Legend */}
                {!loading && summaries.length > 0 && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Frequency Legend:</p>
                        <div className="flex flex-wrap gap-3 text-xs">
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-green-100"></span>
                                <span className="text-gray-600">20+ times</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-blue-100"></span>
                                <span className="text-gray-600">10-19 times</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-purple-100"></span>
                                <span className="text-gray-600">5-9 times</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-gray-100"></span>
                                <span className="text-gray-600">1-4 times</span>
                            </span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
