import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { todayInLimaISO, formatDateForDisplay } from '../lib/todayLima';
import { Navbar } from '../components/Navbar';
import { TodoForm } from '../components/TodoForm';
import { TodoItem } from '../components/TodoItem';
import { streakService } from '../lib/streakService';
import type { Todo } from '../types/todo';

// Helper to organize flat todos into parent-child structure
function organizeTodos(flatTodos: Todo[]): Todo[] {
    const todoMap = new Map<string, Todo>();
    const rootTodos: Todo[] = [];

    // First pass: create map and initialize subtasks array
    flatTodos.forEach((todo) => {
        todoMap.set(todo.id, { ...todo, subtasks: [] });
    });

    // Second pass: organize into hierarchy
    flatTodos.forEach((todo) => {
        const todoWithSubtasks = todoMap.get(todo.id)!;
        if (todo.parent_id) {
            const parent = todoMap.get(todo.parent_id);
            if (parent) {
                parent.subtasks = parent.subtasks || [];
                parent.subtasks.push(todoWithSubtasks);
            }
        } else {
            rootTodos.push(todoWithSubtasks);
        }
    });

    return rootTodos;
}

export function TodosPage() {
    const { user } = useAuth();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [allTodos, setAllTodos] = useState<Todo[]>([]); // Flat list for operations
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(todayInLimaISO());
    const [isOperating, setIsOperating] = useState(false);
    const [streak, setStreak] = useState(streakService.validateStreak());

    const todayDate = todayInLimaISO();
    const isToday = selectedDate === todayDate;

    const fetchTodos = useCallback(async () => {
        if (!isSupabaseConfigured || !user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('todos')
                .select('*')
                .eq('user_id', user.id)
                .eq('task_date', selectedDate)
                .order('created_at', { ascending: false });

            if (fetchError) {
                throw fetchError;
            }

            const flatTodos = (data || []) as Todo[];
            setAllTodos(flatTodos);
            setTodos(organizeTodos(flatTodos));
        } catch (err) {
            console.error('Error fetching todos:', err);
            setError('Error loading tasks. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [user, selectedDate]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    // Re-organize when allTodos changes
    useEffect(() => {
        if (!loading) {
            setTodos(organizeTodos(allTodos));

            // Update streak if all tasks for today are completed
            if (isToday && allTodos.length > 0) {
                const allDone = allTodos.every(t => t.done);
                const newStreak = streakService.updateStreak(allDone);
                setStreak(newStreak);
            }
        }
    }, [allTodos, loading, isToday]);

    const handleAddTodo = async (title: string, category: string | null, repeatDays: number) => {
        setIsOperating(true);
        setError(null);

        if (!user) return;

        try {
            const templateId = crypto.randomUUID();
            const tasksToCreate = [];

            // Create task for today + future days if repeating
            const totalDays = repeatDays > 0 ? repeatDays : 1;

            for (let i = 0; i < totalDays; i++) {
                const taskDate = new Date(todayDate);
                taskDate.setDate(taskDate.getDate() + i);
                const dateStr = taskDate.toISOString().split('T')[0];

                tasksToCreate.push({
                    title,
                    task_date: dateStr,
                    user_id: user.id,
                    parent_id: null,
                    category: category,
                    repeat_days: repeatDays,
                    repeat_start_date: repeatDays > 0 ? todayDate : null,
                    template_id: repeatDays > 0 ? templateId : null,
                });
            }

            const { data, error: insertError } = await supabase
                .from('todos')
                .insert(tasksToCreate)
                .select();

            if (insertError) {
                throw insertError;
            }

            // Add today's task to the list
            if (isToday && data && data.length > 0) {
                const todayTask = data.find((t: Todo) => t.task_date === todayDate);
                if (todayTask) {
                    setAllTodos((prev) => [todayTask as Todo, ...prev]);
                }
            }
        } catch (err) {
            console.error('Error adding todo:', err);
            setError('Error adding task. Please try again.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleAddSubtask = async (parentId: string, title: string) => {
        setIsOperating(true);
        setError(null);

        if (!user) return;

        try {
            const { data, error: insertError } = await supabase
                .from('todos')
                .insert({
                    title,
                    task_date: todayDate,
                    user_id: user.id,
                    parent_id: parentId,
                })
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            if (data) {
                setAllTodos((prev) => [...prev, data as Todo]);
            }
        } catch (err) {
            console.error('Error adding subtask:', err);
            setError('Error adding subtask. Please try again.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleToggleTodo = async (id: string, done: boolean) => {
        setIsOperating(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('todos')
                .update({ done })
                .eq('id', id);

            if (updateError) {
                throw updateError;
            }

            setAllTodos((prev) =>
                prev.map((todo) => (todo.id === id ? { ...todo, done } : todo))
            );
        } catch (err) {
            console.error('Error toggling todo:', err);
            setError('Error updating task. Please try again.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleUpdateTodo = async (id: string, title: string) => {
        setIsOperating(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('todos')
                .update({ title })
                .eq('id', id);

            if (updateError) {
                throw updateError;
            }

            setAllTodos((prev) =>
                prev.map((todo) => (todo.id === id ? { ...todo, title } : todo))
            );
        } catch (err) {
            console.error('Error updating todo:', err);
            setError('Error updating task. Please try again.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleDeleteTodo = async (id: string) => {
        setIsOperating(true);
        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('todos')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw deleteError;
            }

            setAllTodos((prev) => prev.filter((todo) => todo.id !== id && todo.parent_id !== id));
        } catch (err) {
            console.error('Error deleting todo:', err);
            setError('Error deleting task. Please try again.');
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

    const mainTodos = todos;
    const completedCount = allTodos.filter((t) => t.done).length;
    const totalCount = allTodos.length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar streak={streak} />

            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isToday ? "Today's Tasks" : 'History'}
                            </h2>
                            <p className="text-gray-600 mt-1 first-letter:uppercase">
                                {formatDateForDisplay(selectedDate)}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                max={todayDate}
                                className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                         text-sm"
                            />
                            {!isToday && (
                                <button
                                    onClick={goToToday}
                                    className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50
                           hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                                >
                                    Today
                                </button>
                            )}
                        </div>
                    </div>

                    {totalCount > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Total progress</span>
                                <span>{completedCount} of {totalCount} completed</span>
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

                {isToday && (
                    <div className="mb-6">
                        <TodoForm onAdd={handleAddTodo} disabled={isOperating} />
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                        <p className="text-gray-600">Loading tasks...</p>
                    </div>
                ) : mainTodos.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <span className="text-3xl">📝</span>
                        </div>
                        <p className="text-gray-600">
                            {isToday
                                ? "You don't have any tasks for today. Add one!"
                                : 'No tasks recorded for this date.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {mainTodos.map((todo) => (
                            <TodoItem
                                key={todo.id}
                                todo={todo}
                                onToggle={handleToggleTodo}
                                onDelete={handleDeleteTodo}
                                onUpdate={handleUpdateTodo}
                                onAddSubtask={isToday ? handleAddSubtask : undefined}
                                disabled={isOperating}
                            />
                        ))}
                    </div>
                )}

                {!loading && totalCount > 0 && completedCount === totalCount && (
                    <div className="mt-8 text-center py-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <span className="text-4xl mb-2 block">🎉</span>
                        <p className="text-green-700 font-medium">
                            Congratulations! You completed all your tasks
                            {isToday ? ' for today' : ' for this day'}.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
