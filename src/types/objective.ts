// Objective: A goal with auto-calculated duration from subtasks
export interface Objective {
    id: string;
    user_id: string;
    title: string;
    start_date: string;
    created_at: string;
    completed_at: string | null;
    tasks?: ObjectiveTask[];
    // Calculated fields (not stored in DB)
    calculated_duration?: number;
    days_elapsed?: number;
}

// Task: Belongs to an objective, has a category
export interface ObjectiveTask {
    id: string;
    objective_id: string;
    title: string;
    category: string;
    created_at: string;
    subtasks?: ObjectiveSubtask[];
}

// Subtask: Has phase order and duration
export interface ObjectiveSubtask {
    id: string;
    task_id: string;
    title: string;
    phase_order: number;
    duration_days: number;
    created_at: string;
    // Runtime fields
    is_active?: boolean;
    completed_today?: boolean;
}

// Daily completion tracking
export interface SubtaskCompletion {
    id: string;
    subtask_id: string;
    user_id: string;
    completion_date: string;
    created_at: string;
}

// Insert types
export interface ObjectiveInsert {
    title: string;
    start_date: string;
    user_id: string;
}

export interface ObjectiveTaskInsert {
    objective_id: string;
    title: string;
    category: string;
}

export interface ObjectiveSubtaskInsert {
    task_id: string;
    title: string;
    phase_order: number;
    duration_days: number;
}

export interface SubtaskCompletionInsert {
    subtask_id: string;
    user_id: string;
    completion_date: string;
}
