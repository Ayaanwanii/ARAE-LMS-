/**
 * Attendance Tracking Hooks
 * Records user login, heartbeat for online status, and time-spent tracking.
 * Admin hooks for fetching attendance statistics.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    Timestamp,
    serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const HEARTBEAT_INTERVAL = 60_000; // 60 seconds
const ONLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes

function getTodayString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Records attendance on login and sends heartbeats every 60s.
 * Should be called once in the dashboard layout.
 */
export function useRecordAttendance() {
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const sessionStartRef = useRef<number>(Date.now());

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const today = getTodayString();
        const docId = `${user.uid}_${today}`;
        const docRef = doc(db, 'user_attendance', docId);

        // Record initial login
        const recordLogin = async () => {
            try {
                // Fetch user profile for denormalized fields
                let userData: any = {};
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const d = userDoc.data();
                        userData = {
                            displayName: d.displayName || user.displayName || 'Anonymous',
                            photoUrl: d.photoUrl || '',
                            schoolName: d.schoolName || '',
                            countryRef: d.countryRef || '',
                            stateRef: d.stateRef || '',
                            age: d.age || 0,
                        };
                    }
                } catch (e) { /* ignore */ }

                const existing = await getDoc(docRef);
                if (existing.exists()) {
                    // Already logged in today — just update lastActive
                    await updateDoc(docRef, {
                        lastActive: serverTimestamp(),
                        ...userData,
                    });
                } else {
                    // First login today
                    await setDoc(docRef, {
                        userId: user.uid,
                        date: today,
                        loginTime: serverTimestamp(),
                        lastActive: serverTimestamp(),
                        totalSeconds: 0,
                        ...userData,
                    });
                }
            } catch (e) {
                console.error('Error recording attendance:', e);
            }
        };

        recordLogin();
        sessionStartRef.current = Date.now();

        // Heartbeat: update lastActive + accumulate time
        const sendHeartbeat = async () => {
            try {
                const elapsed = Math.round((Date.now() - sessionStartRef.current) / 1000);
                sessionStartRef.current = Date.now();

                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const current = snap.data().totalSeconds || 0;
                    await updateDoc(docRef, {
                        lastActive: serverTimestamp(),
                        totalSeconds: current + elapsed,
                    });
                }
            } catch (e) {
                // Silent fail
            }
        };

        heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // Cleanup on unmount / logout
        return () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }
            // Final heartbeat
            sendHeartbeat();
        };
    }, [auth.currentUser?.uid]);
}

export interface AttendanceRecord {
    userId: string;
    date: string;
    loginTime: any;
    lastActive: any;
    totalSeconds: number;
    displayName: string;
    photoUrl: string;
    schoolName: string;
    countryRef: string;
    stateRef: string;
    age: number;
}

/**
 * Admin hook: Fetch today's attendance data for all users.
 */
export function useAttendanceStats(dateOverride?: string) {
    const date = dateOverride || getTodayString();

    return useQuery({
        queryKey: ['attendance-stats', date],
        queryFn: async () => {
            const q = query(
                collection(db, 'user_attendance'),
                where('date', '==', date)
            );
            const snapshot = await getDocs(q);

            const records: AttendanceRecord[] = [];
            snapshot.forEach(doc => {
                records.push(doc.data() as AttendanceRecord);
            });

            const now = Date.now();

            // Users logged in today
            const loggedInToday = records.length;

            // Currently online (lastActive within threshold)
            const onlineUsers = records.filter(r => {
                if (!r.lastActive) return false;
                const lastMs = r.lastActive.toMillis ? r.lastActive.toMillis() : (r.lastActive.seconds ? r.lastActive.seconds * 1000 : 0);
                return (now - lastMs) < ONLINE_THRESHOLD;
            });

            // Total hours spent (sum of totalSeconds)
            const totalSeconds = records.reduce((sum, r) => sum + (r.totalSeconds || 0), 0);
            const totalHours = Math.round((totalSeconds / 3600) * 10) / 10; // 1 decimal

            return {
                records,
                loggedInToday,
                currentlyOnline: onlineUsers.length,
                onlineUsers,
                totalHours,
                totalSeconds,
                date,
            };
        },
        refetchInterval: 60_000, // Refetch every minute to keep online status fresh
    });
}

/**
 * Fetch login streak for a specific user.
 */
export function useUserLoginStreak(userId: string | undefined) {
    return useQuery({
        queryKey: ['user-login-streak', userId],
        queryFn: async () => {
            if (!userId) return 0;

            const attendanceRef = collection(db, 'user_attendance');
            const q = query(attendanceRef, where('userId', '==', userId));
            const aSnaps = await getDocs(q);
            
            const attendanceDates = new Set<string>();
            aSnaps.forEach(doc => {
                const data = doc.data();
                if (data.date) attendanceDates.add(data.date);
            });

            let streak = 0;
            const now = new Date();
            let checkDate = new Date(now);
            
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

            return streak;
        },
        enabled: !!userId,
        staleTime: 30000,
    });
}
