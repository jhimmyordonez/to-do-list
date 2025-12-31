export interface Goal {
    id: string;
    user_id: string;
    title: string;
    done: boolean;
    target_month: string; // YYYY-MM-DD (first day of month)
    created_at: string;
    completed_at: string | null;
    parent_id: string | null; // null = main goal, string = sub-goal of parent
    subgoals?: Goal[]; // Populated on frontend for display
}

export interface GoalInsert {
    title: string;
    target_month: string;
    user_id: string;
    parent_id?: string | null;
}

export interface GoalUpdate {
    title?: string;
    done?: boolean;
    completed_at?: string | null;
}
