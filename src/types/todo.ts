export interface Todo {
    id: string;
    user_id: string;
    title: string;
    done: boolean;
    task_date: string;
    created_at: string;
    parent_id: string | null; // null = main task, string = subtask of parent
    subtasks?: Todo[]; // Populated on frontend for display
}

export interface TodoInsert {
    title: string;
    task_date: string;
    user_id: string;
    parent_id?: string | null;
}

export interface TodoUpdate {
    title?: string;
    done?: boolean;
}
