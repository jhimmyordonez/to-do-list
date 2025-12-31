-- ============================================
-- Daily To-Do Application - Supabase Schema
-- ============================================

-- Table: public.todos
-- Stores all user tasks with date tracking and subtask support
CREATE TABLE public.todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  task_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  parent_id uuid REFERENCES public.todos(id) ON DELETE CASCADE -- null = main task, uuid = subtask
);

-- Index for optimized queries by user and date
CREATE INDEX idx_todos_user_date ON public.todos(user_id, task_date);

-- Index for subtask queries
CREATE INDEX idx_todos_parent ON public.todos(parent_id);

-- Enable Row Level Security
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for authenticated users
-- ============================================

-- SELECT: Users can only read their own todos
CREATE POLICY "select_own_todos" ON public.todos
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert todos for themselves
CREATE POLICY "insert_own_todos" ON public.todos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own todos
CREATE POLICY "update_own_todos" ON public.todos
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own todos
CREATE POLICY "delete_own_todos" ON public.todos
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- Security Pattern: Enforce user_id on insert via trigger
-- This prevents users from trying to insert a todo with another user's user_id.
-- It also automatically sets the user_id if not provided.
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_todo_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_todo_insert
  BEFORE INSERT ON public.todos
  FOR EACH ROW EXECUTE PROCEDURE public.handle_todo_insert();

-- ============================================
-- Monthly Goals - Persistent goals that don't reset
-- ============================================

-- Table: public.monthly_goals
-- Stores user's monthly objectives/goals that persist until completed
CREATE TABLE public.monthly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  target_month date NOT NULL, -- First day of the target month (e.g., 2025-01-01)
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz -- When the goal was marked as completed
);

-- Index for optimized queries by user and month
CREATE INDEX idx_monthly_goals_user_month ON public.monthly_goals(user_id, target_month);

-- Enable Row Level Security
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for monthly_goals
-- ============================================

-- SELECT: Users can only read their own goals
CREATE POLICY "select_own_goals" ON public.monthly_goals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert goals for themselves
CREATE POLICY "insert_own_goals" ON public.monthly_goals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own goals
CREATE POLICY "update_own_goals" ON public.monthly_goals
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own goals
CREATE POLICY "delete_own_goals" ON public.monthly_goals
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- Trigger to enforce user_id on insert
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_goal_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_goal_insert
  BEFORE INSERT ON public.monthly_goals
  FOR EACH ROW EXECUTE PROCEDURE public.handle_goal_insert();
