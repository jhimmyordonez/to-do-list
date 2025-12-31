import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { GoalForm } from '../components/GoalForm';
import { GoalItem } from '../components/GoalItem';
import type { Goal } from '../types/goal';

// Get the first day of a month in YYYY-MM-DD format
function getMonthStart(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
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
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(getMonthStart(new Date()));
    const [isOperating, setIsOperating] = useState(false);

    const currentMonth = getMonthStart(new Date());
    const isCurrentMonth = selectedMonth === currentMonth;
    const isFutureMonth = selectedMonth > currentMonth;
    const canAddGoals = isCurrentMonth || isFutureMonth;

    const fetchGoals = useCallback(async () => {
        if (!isSupabaseConfigured || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('monthly_goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('target_month', selectedMonth)
                .order('created_at', { ascending: false });

            if (fetchError) {
                throw fetchError;
            }

            setGoals((data || []) as Goal[]);
        } catch (err) {
            console.error('Error fetching goals:', err);
            setError('Error loading goals. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user, selectedMonth]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const handleAddGoal = async (title: string) => {
        setIsOperating(true);
        setError(null);

        if (!user) return;

        try {
            const { data, error: insertError } = await supabase
                .from('monthly_goals')
                .insert({
                    title,
                    target_month: selectedMonth,
                    user_id: user.id,
                })
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            if (data) {
                setGoals((prev) => [data as Goal, ...prev]);
            }
        } catch (err) {
            console.error('Error adding goal:', err);
            setError('Error adding goal. Please try again.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleToggleGoal = async (id: string, done: boolean) => {
        setIsOperating(true);
        setError(null);

        try {
            const updateData: { done: boolean; completed_at: string | null } = {
                done,
                completed_at: done ? new Date().toISOString() : null,
            };

            const { error: updateError } = await supabase
                .from('monthly_goals')
                .update(updateData)
                .eq('id', id);

            if (updateError) {
                throw updateError;
            }

            setGoals((prev) =>
                prev.map((goal) =>
                    goal.id === id
                        ? { ...goal, done, completed_at: updateData.completed_at }
                        : goal
                )
            );
        } catch (err) {
            console.error('Error toggling goal:', err);
            setError('Error updating goal. Please try again.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleUpdateGoal = async (id: string, title: string) => {
        setIsOperating(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('monthly_goals')
                .update({ title })
                .eq('id', id);

            if (updateError) {
                throw updateError;
            }

            setGoals((prev) =>
                prev.map((goal) => (goal.id === id ? { ...goal, title } : goal))
            );
        } catch (err) {
            console.error('Error updating goal:', err);
            setError('Error updating goal. Please try again.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleDeleteGoal = async (id: string) => {
        setIsOperating(true);
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('monthly_goals')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw deleteError;
            }

            setGoals((prev) => prev.filter((goal) => goal.id !== id));
        } catch (err) {
            console.error('Error deleting goal:', err);
            setError('Error deleting goal. Please try again.');
        } finally {
            setIsOperating(false);
        }
    };

    const completedCount = goals.filter((g) => g.done).length;
    const totalCount = goals.length;

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
                                {isCurrentMonth
                                    ? 'Current month goals'
                                    : isFutureMonth
                                        ? 'Future month goals'
                                        : 'Past month goals'}
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
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {totalCount > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Goals progress</span>
                                <span>{completedCount} of {totalCount} achieved</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Add Goal Form */}
                {canAddGoals && (
                    <div className="mb-6">
                        <GoalForm onAdd={handleAddGoal} disabled={isOperating} />
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Goals List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent mb-4"></div>
                        <p className="text-gray-600">Loading goals...</p>
                    </div>
                ) : goals.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <span className="text-3xl">🎯</span>
                        </div>
                        <p className="text-gray-600">
                            {canAddGoals
                                ? "No goals for this month yet. Add your first goal!"
                                : "No goals were set for this month."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {goals.map((goal) => (
                            <GoalItem
                                key={goal.id}
                                goal={goal}
                                onToggle={handleToggleGoal}
                                onUpdate={handleUpdateGoal}
                                onDelete={handleDeleteGoal}
                                disabled={isOperating}
                            />
                        ))}
                    </div>
                )}

                {/* Success Message */}
                {!loading && totalCount > 0 && completedCount === totalCount && (
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
