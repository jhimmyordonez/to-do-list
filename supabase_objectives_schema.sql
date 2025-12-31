-- Supabase SQL for Goal Planning System
-- Run this in your Supabase SQL Editor

-- 1. Objectives table
CREATE TABLE IF NOT EXISTS objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL
);

-- 2. Objective Tasks table
CREATE TABLE IF NOT EXISTS objective_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Objective Subtasks table
CREATE TABLE IF NOT EXISTS objective_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES objective_tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    phase_order INTEGER NOT NULL DEFAULT 1,
    duration_days INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subtask Completions table (for tracking daily completion)
CREATE TABLE IF NOT EXISTS objective_subtask_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subtask_id UUID NOT NULL REFERENCES objective_subtasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subtask_id, completion_date)
);

-- Enable RLS on all tables
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE objective_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE objective_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE objective_subtask_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for objectives
CREATE POLICY "Users can view own objectives" ON objectives
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own objectives" ON objectives
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own objectives" ON objectives
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own objectives" ON objectives
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for objective_tasks
CREATE POLICY "Users can view own objective tasks" ON objective_tasks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM objectives WHERE objectives.id = objective_tasks.objective_id AND objectives.user_id = auth.uid())
    );

CREATE POLICY "Users can insert own objective tasks" ON objective_tasks
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM objectives WHERE objectives.id = objective_tasks.objective_id AND objectives.user_id = auth.uid())
    );

CREATE POLICY "Users can update own objective tasks" ON objective_tasks
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM objectives WHERE objectives.id = objective_tasks.objective_id AND objectives.user_id = auth.uid())
    );

CREATE POLICY "Users can delete own objective tasks" ON objective_tasks
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM objectives WHERE objectives.id = objective_tasks.objective_id AND objectives.user_id = auth.uid())
    );

-- RLS Policies for objective_subtasks
CREATE POLICY "Users can view own objective subtasks" ON objective_subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM objective_tasks 
            JOIN objectives ON objectives.id = objective_tasks.objective_id 
            WHERE objective_tasks.id = objective_subtasks.task_id AND objectives.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own objective subtasks" ON objective_subtasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM objective_tasks 
            JOIN objectives ON objectives.id = objective_tasks.objective_id 
            WHERE objective_tasks.id = objective_subtasks.task_id AND objectives.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own objective subtasks" ON objective_subtasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM objective_tasks 
            JOIN objectives ON objectives.id = objective_tasks.objective_id 
            WHERE objective_tasks.id = objective_subtasks.task_id AND objectives.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own objective subtasks" ON objective_subtasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM objective_tasks 
            JOIN objectives ON objectives.id = objective_tasks.objective_id 
            WHERE objective_tasks.id = objective_subtasks.task_id AND objectives.user_id = auth.uid()
        )
    );

-- RLS Policies for objective_subtask_completions
CREATE POLICY "Users can view own completions" ON objective_subtask_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON objective_subtask_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON objective_subtask_completions
    FOR DELETE USING (auth.uid() = user_id);
