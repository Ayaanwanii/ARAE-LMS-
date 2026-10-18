import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useFolderAnalytics(userId: string | undefined, folderPrograms: any[]) {
    return useQuery({
        queryKey: ['folder-analytics', userId, folderPrograms.map(p => p.id).join(',')],
        queryFn: async () => {
            if (!userId) return null;

            // 1. Programmes Completed %
            let completedPrograms = 0;
            const programIds = folderPrograms.map(p => p.id);
            const totalPrograms = programIds.length;
            const programsStatus = folderPrograms.map(p => ({ id: p.id, title: p.title, completed: false }));

            if (totalPrograms > 0) {
                const progressRef = collection(db, 'user_program_progress');
                const q = query(progressRef, where('userId', '==', userId));
                const progressSnaps = await getDocs(q);

                const progressMap = new Map();
                progressSnaps.forEach(doc => {
                    const data = doc.data();
                    if (data.programId && programIds.includes(data.programId)) {
                        progressMap.set(data.programId, data);
                    }
                });

                programsStatus.forEach(ps => {
                    const program = folderPrograms.find(p => p.id === ps.id);
                    const progress = progressMap.get(ps.id);
                    if (progress && program) {
                        const completedIt = progress.completedEpisodes || [];
                        const totalEp = program.episode?.length || 0;
                        if (totalEp > 0 && completedIt.length >= totalEp) {
                            ps.completed = true;
                            completedPrograms++;
                        }
                    }
                });
            }

            const programsCompletedPercent = totalPrograms > 0 ? Math.round((completedPrograms / totalPrograms) * 100) : 0;

            // 2. Login Streak
            let streak = 0;
            // Fetch the last 30 days of attendance
            // Since firestore doesn't support whereIn for more than 10, we'll just fetch all attendance for user and filter.
            const attendanceRef = collection(db, 'user_attendance');
            const aq = query(attendanceRef, where('userId', '==', userId));
            const aSnaps = await getDocs(aq);
            
            const attendanceDates = new Set<string>();
            aSnaps.forEach(doc => {
                const data = doc.data();
                if (data.date) attendanceDates.add(data.date);
            });

            // Calculate streak backwards from today or yesterday
            const now = new Date();
            let checkDate = new Date(now);
            
            // Helper to get YYYY-MM-DD
            const getStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            const todayStr = getStr(now);
            checkDate.setDate(checkDate.getDate() - 1);
            const yesterdayStr = getStr(checkDate);

            if (attendanceDates.has(todayStr)) {
                streak = 1;
                checkDate = new Date(now);
                checkDate.setDate(checkDate.getDate() - 1);
                while (attendanceDates.has(getStr(checkDate))) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }
            } else if (attendanceDates.has(yesterdayStr)) {
                // Not logged in today yet, but logged in yesterday
                streak = 1;
                checkDate = new Date(now);
                checkDate.setDate(checkDate.getDate() - 2);
                while (attendanceDates.has(getStr(checkDate))) {
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }
            } else {
                streak = 0;
            }

            return {
                programsCompletedPercent,
                programsStatus,
                streak
            };
        },
        enabled: !!userId,
    });
}
