import { todayInLimaISO } from './todayLima';

interface StreakData {
    currentStreak: number;
    lastCompletedDate: string | null;
}

const STORAGE_KEY = 'todo_app_streak';

/**
 * Service to manage user streaks in localStorage.
 * A streak increments when all tasks for the current day are completed.
 */
export const streakService = {
    /**
     * Gets the current streak data from localStorage.
     */
    getStreakData(): StreakData {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing streak data:', e);
            }
        }
        return { currentStreak: 0, lastCompletedDate: null };
    },

    /**
     * Updates the streak based on whether all tasks for TODAY are completed.
     * @param isAllCompleted - True if all tasks for today are done.
     */
    updateStreak(isAllCompleted: boolean): number {
        const today = todayInLimaISO();
        const data = this.getStreakData();

        // If not all completed today, streak doesn't increase.
        // If it was already completed today, we don't change anything.
        if (!isAllCompleted) {
            return data.currentStreak;
        }

        if (data.lastCompletedDate === today) {
            return data.currentStreak;
        }

        // Check if the streak is consecutive (yesterday or first time)
        let newStreak = 1;
        if (data.lastCompletedDate) {
            const lastDate = new Date(data.lastCompletedDate);
            const currentDate = new Date(today);

            // Calculate difference in days
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                newStreak = data.currentStreak + 1;
            } else if (diffDays === 0) {
                newStreak = data.currentStreak;
            } else {
                newStreak = 1; // Reset streak
            }
        }

        const newData: StreakData = {
            currentStreak: newStreak,
            lastCompletedDate: today,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        return newStreak;
    },

    /**
     * Validates if the streak is still active (was maintained at least until yesterday).
     * If more than one day passed since last completion, the streak resets.
     */
    validateStreak(): number {
        const today = todayInLimaISO();
        const data = this.getStreakData();

        if (!data.lastCompletedDate) return 0;

        const lastDate = new Date(data.lastCompletedDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            const newData: StreakData = {
                currentStreak: 0,
                lastCompletedDate: data.lastCompletedDate, // Keep last date but reset count
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            return 0;
        }

        return data.currentStreak;
    }
};
