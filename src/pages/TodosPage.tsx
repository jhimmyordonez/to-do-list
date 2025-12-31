import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { todayInLimaISO, formatDateForDisplay } from '../lib/todayLima';
import { Navbar } from '../components/Navbar';
import { streakService } from '../lib/streakService';
import { fetchActiveSubtasksForToday, toggleSubtaskCompletion } from '../lib/objectiveService';
import type { ObjectiveSubtask } from '../types/objective';

interface ActiveSubtaskItem {
    subtask: ObjectiveSubtask;
    taskTitle: string;
    taskCategory: string;
    objectiveTitle: string;
    completed: boolean;
}

export function TodosPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(todayInLimaISO());
    const [isOperating, setIsOperating] = useState(false);
    const [streak, setStreak] = useState(streakService.validateStreak());
    const [subtasks, setSubtasks] = useState<ActiveSubtaskItem[]>([]);

    const todayDate = todayInLimaISO();
    const isToday = selectedDate === todayDate;

    const fetchData = useCallback(async () => {
        if (!isSupabaseConfigured || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await fetchActiveSubtasksForToday(user.id, selectedDate);
            setSubtasks(data);

            // Update streak
            if (isToday && data.length > 0) {
                const allCompleted = data.every(s => s.completed);
                const newStreak = streakService.updateStreak(allCompleted);
                setStreak(newStreak);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Error loading tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user, selectedDate, isToday]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggle = async (subtaskId: string, completed: boolean) => {
        if (!user) return;
        setIsOperating(true);

        try {
            await toggleSubtaskCompletion(subtaskId, user.id, selectedDate, completed);
            setSubtasks(prev => prev.map(item =>
                item.subtask.id === subtaskId ? { ...item, completed } : item
            ));

            // Update streak
            const updatedSubtasks = subtasks.map(item =>
                item.subtask.id === subtaskId ? { ...item, completed } : item
            );
            if (isToday && updatedSubtasks.length > 0) {
                const allCompleted = updatedSubtasks.every(s => s.completed);
                const newStreak = streakService.updateStreak(allCompleted);
                setStreak(newStreak);
            }
        } catch (err) {
            console.error('Error toggling task:', err);
            setError('Error updating task.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
    };

    const goToToday = () => {
        setSelectedDate(todayDate);
    };

    // Group subtasks by category
    const groupedByCategory = subtasks.reduce((acc, item) => {
        if (!acc[item.taskCategory]) {
            acc[item.taskCategory] = [];
        }
        acc[item.taskCategory].push(item);
        return acc;
    }, {} as Record<string, ActiveSubtaskItem[]>);

    const completedCount = subtasks.filter(s => s.completed).length;
    const totalCount = subtasks.length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar streak={streak} />

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isToday ? "Today's Tasks" : 'Task History'}
                            </h2>
                            <p className="text-gray-500 mt-1">
                                {formatDateForDisplay(selectedDate)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                max={todayDate}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm
                                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            {!isToday && (
                                <button
                                    onClick={goToToday}
                                    className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50
                                        hover:bg-indigo-100 rounded-lg transition-colors"
                                >
                                    Today
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress */}
                    {totalCount > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Progress</span>
                                <span className="font-medium">{completedCount} of {totalCount}</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                                />
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

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                        <p className="text-gray-500">Loading...</p>
                    </div>
                ) : subtasks.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl">📋</span>
                        </div>
                        <p className="text-gray-600 mb-2">No tasks for {isToday ? 'today' : 'this date'}</p>
                        <p className="text-sm text-gray-400 mb-6">
                            Plan your objectives in Goal Planning to see tasks here.
                        </p>
                        <button
                            onClick={() => navigate('/goals')}
                            className="px-5 py-2.5 bg-indigo-500 text-white font-medium rounded-lg
                                hover:bg-indigo-600 transition-colors"
                        >
                            Go to Goal Planning
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedByCategory).map(([category, items]) => (
                            <div key={category}>
                                {/* Category Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                                    <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                        {items.filter(i => i.completed).length}/{items.length}
                                    </span>
                                </div>

                                {/* Tasks in category */}
                                <div className="space-y-3 ml-4">
                                    {items.map((item) => (
                                        <div
                                            key={item.subtask.id}
                                            className={`flex items-start gap-4 p-4 bg-white rounded-xl border transition-all duration-200
                                                ${item.completed
                                                    ? 'border-gray-200 bg-gray-50'
                                                    : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => handleToggle(item.subtask.id, !item.completed)}
                                                disabled={isOperating || !isToday}
                                                className={`flex-shrink-0 w-6 h-6 mt-0.5 rounded-md border-2 flex items-center justify-center
                                                    transition-all duration-200 disabled:cursor-not-allowed
                                                    ${item.completed
                                                        ? 'bg-indigo-500 border-indigo-500 text-white'
                                                        : 'border-gray-300 hover:border-indigo-400'
                                                    }
                                                    ${!isToday ? 'opacity-60' : ''}`}
                                            >
                                                {item.completed && (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium leading-relaxed transition-all
                                                    ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {item.subtask.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                                                    <span>{item.objectiveTitle}</span>
                                                    <span>•</span>
                                                    <span>{item.taskTitle}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Success Message */}
                {!loading && totalCount > 0 && completedCount === totalCount && (
                    <div className="mt-10 text-center py-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                        <span className="text-5xl mb-3 block">🎉</span>
                        <p className="text-green-700 font-semibold text-lg">All tasks completed!</p>
                        <p className="text-green-600 text-sm mt-1">Great job today!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
