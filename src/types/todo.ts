export interface Todo {
    id: string;
    user_id: string;
    title: string;
    done: boolean;
    task_date: string;
    created_at: string;
    parent_id: string | null; // null = main task, string = subtask of parent
    subtasks?: Todo[]; // Populated on frontend for display
    category: string | null; // User-defined category for grouping
    repeat_days: number; // 0 = no repeat, N = repeat for N days
    repeat_start_date: string | null; // When the recurring series started
    template_id: string | null; // Links all instances of the same recurring task
}

export interface TodoInsert {
    title: string;
    task_date: string;
    user_id: string;
    parent_id?: string | null;
    category?: string | null;
    repeat_days?: number;
    repeat_start_date?: string | null;
    template_id?: string | null;
}

export interface TodoUpdate {
    title?: string;
    done?: boolean;
}
