import { supabase } from './supabaseClient';
import type { Objective, ObjectiveSubtask } from '../types/objective';

/**
 * Calculate which subtasks are active for a given date
 */
export function getActiveSubtasks(
    objective: Objective,
    targetDate: Date
): ObjectiveSubtask[] {
    const startDate = new Date(objective.start_date);
    const daysElapsed = Math.floor(
        (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysElapsed < 0) return [];

    const activeSubtasks: ObjectiveSubtask[] = [];

    for (const task of objective.tasks || []) {
        const subtasks = task.subtasks || [];
        if (subtasks.length === 0) continue;

        // Group subtasks by phase_order
        const phaseGroups = new Map<number, ObjectiveSubtask[]>();
        for (const subtask of subtasks) {
            const group = phaseGroups.get(subtask.phase_order) || [];
            group.push(subtask);
            phaseGroups.set(subtask.phase_order, group);
        }

        // Sort phases by order
        const sortedPhases = Array.from(phaseGroups.keys()).sort((a, b) => a - b);

        // Calculate when each phase starts
        let phaseStartDay = 0;
        for (const phase of sortedPhases) {
            const subtasksInPhase = phaseGroups.get(phase)!;
            const maxDuration = Math.max(...subtasksInPhase.map(s => s.duration_days));
            const phaseEndDay = phaseStartDay + maxDuration;

            // Check if today falls within this phase
            if (daysElapsed >= phaseStartDay && daysElapsed < phaseEndDay) {
                // Add subtasks that haven't exceeded their individual duration
                for (const subtask of subtasksInPhase) {
                    const dayInPhase = daysElapsed - phaseStartDay;
                    if (dayInPhase < subtask.duration_days) {
                        activeSubtasks.push({
                            ...subtask,
                            is_active: true
                        });
                    }
                }
            }

            phaseStartDay = phaseEndDay;
        }
    }

    return activeSubtasks;
}

/**
 * Calculate total duration of an objective based on its subtasks
 */
export function calculateObjectiveDuration(objective: Objective): number {
    let totalDuration = 0;

    for (const task of objective.tasks || []) {
        const subtasks = task.subtasks || [];
        if (subtasks.length === 0) continue;

        // Group subtasks by phase_order
        const phaseGroups = new Map<number, ObjectiveSubtask[]>();
        for (const subtask of subtasks) {
            const group = phaseGroups.get(subtask.phase_order) || [];
            group.push(subtask);
            phaseGroups.set(subtask.phase_order, group);
        }

        // Sum the max duration of each phase
        let taskDuration = 0;
        phaseGroups.forEach((subtasksInPhase) => {
            const maxDuration = Math.max(...subtasksInPhase.map(s => s.duration_days));
            taskDuration += maxDuration;
        });

        // Use the longest task chain
        if (taskDuration > totalDuration) {
            totalDuration = taskDuration;
        }
    }

    return totalDuration;
}

/**
 * Fetch all objectives with their tasks and subtasks
 */
export async function fetchObjectivesWithDetails(userId: string): Promise<Objective[]> {
    // Fetch objectives
    const { data: objectives, error: objError } = await supabase
        .from('objectives')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (objError) throw objError;
    if (!objectives || objectives.length === 0) return [];

    // Fetch tasks for all objectives
    const objectiveIds = objectives.map(o => o.id);
    const { data: tasks, error: taskError } = await supabase
        .from('objective_tasks')
        .select('*')
        .in('objective_id', objectiveIds);

    if (taskError) throw taskError;

    // Fetch subtasks for all tasks
    const taskIds = (tasks || []).map(t => t.id);
    let subtasks: ObjectiveSubtask[] = [];
    if (taskIds.length > 0) {
        const { data: subtaskData, error: subtaskError } = await supabase
            .from('objective_subtasks')
            .select('*')
            .in('task_id', taskIds);

        if (subtaskError) throw subtaskError;
        subtasks = subtaskData || [];
    }

    // Organize into hierarchy
    const taskMap = new Map<string, typeof tasks[0] & { subtasks: ObjectiveSubtask[] }>();
    for (const task of tasks || []) {
        taskMap.set(task.id, { ...task, subtasks: [] });
    }

    for (const subtask of subtasks) {
        const task = taskMap.get(subtask.task_id);
        if (task) {
            task.subtasks.push(subtask);
        }
    }

    const result: Objective[] = objectives.map(obj => ({
        ...obj,
        tasks: (tasks || [])
            .filter(t => t.objective_id === obj.id)
            .map(t => taskMap.get(t.id)!)
    }));

    // Calculate duration for each objective
    for (const obj of result) {
        obj.calculated_duration = calculateObjectiveDuration(obj);
        const startDate = new Date(obj.start_date);
        const today = new Date();
        obj.days_elapsed = Math.max(0, Math.floor(
            (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ));
    }

    return result;
}

/**
 * Fetch active subtasks for today with completion status
 */
export async function fetchActiveSubtasksForToday(
    userId: string,
    dateStr: string
): Promise<{ subtask: ObjectiveSubtask; taskTitle: string; taskCategory: string; objectiveTitle: string; completed: boolean }[]> {
    const objectives = await fetchObjectivesWithDetails(userId);
    const targetDate = new Date(dateStr + 'T12:00:00');

    // Get all active subtasks
    const activeItems: {
        subtask: ObjectiveSubtask;
        taskTitle: string;
        taskCategory: string;
        objectiveTitle: string;
    }[] = [];

    for (const objective of objectives) {
        const activeSubtasks = getActiveSubtasks(objective, targetDate);
        for (const subtask of activeSubtasks) {
            // Find the task this subtask belongs to
            const task = objective.tasks?.find(t =>
                t.subtasks?.some(s => s.id === subtask.id)
            );
            if (task) {
                activeItems.push({
                    subtask,
                    taskTitle: task.title,
                    taskCategory: task.category,
                    objectiveTitle: objective.title
                });
            }
        }
    }

    // Fetch completions for today
    const subtaskIds = activeItems.map(item => item.subtask.id);
    let completions: string[] = [];

    if (subtaskIds.length > 0) {
        const { data } = await supabase
            .from('objective_subtask_completions')
            .select('subtask_id')
            .eq('user_id', userId)
            .eq('completion_date', dateStr)
            .in('subtask_id', subtaskIds);

        completions = (data || []).map(c => c.subtask_id);
    }

    return activeItems.map(item => ({
        ...item,
        completed: completions.includes(item.subtask.id)
    }));
}

/**
 * Toggle subtask completion for a specific date
 */
export async function toggleSubtaskCompletion(
    subtaskId: string,
    userId: string,
    dateStr: string,
    completed: boolean
): Promise<void> {
    if (completed) {
        await supabase
            .from('objective_subtask_completions')
            .insert({
                subtask_id: subtaskId,
                user_id: userId,
                completion_date: dateStr
            });
    } else {
        await supabase
            .from('objective_subtask_completions')
            .delete()
            .eq('subtask_id', subtaskId)
            .eq('user_id', userId)
            .eq('completion_date', dateStr);
    }
}
