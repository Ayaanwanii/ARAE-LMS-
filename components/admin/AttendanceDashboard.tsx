'use client';

import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/lib/stores/toastStore';
import { useAttendanceStats, AttendanceRecord } from '@/lib/hooks/useAttendance';
import Modal from '@/components/ui/Modal';

type CardType = 'loggedIn' | 'online' | 'hours' | null;

export default function AttendanceDashboard() {
    const getTodayStr = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };
    const [selectedDate, setSelectedDate] = useState(getTodayStr());
    const isToday = selectedDate === getTodayStr();
    const { data: stats, isLoading } = useAttendanceStats(selectedDate);
    const [activeCard, setActiveCard] = useState<CardType>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [filters, setFilters] = useState({
        country: '',
        state: '',
        school: '',
        ageRange: '',
    });

    // Extract unique filter options
    const { uniqueCountries, uniqueStates, uniqueSchools } = useMemo(() => {
        if (!stats?.records) return { uniqueCountries: [], uniqueStates: [], uniqueSchools: [] };
        const countries = new Set<string>();
        const states = new Set<string>();
        const schools = new Set<string>();
        stats.records.forEach((r: AttendanceRecord) => {
            if (r.countryRef) countries.add(r.countryRef);
            if (r.stateRef) states.add(r.stateRef);
            if (r.schoolName) schools.add(r.schoolName);
        });
        return {
            uniqueCountries: Array.from(countries).sort(),
            uniqueStates: Array.from(states).sort(),
            uniqueSchools: Array.from(schools).sort(),
        };
    }, [stats?.records]);

    // Apply filters to records
    const filterRecords = (records: AttendanceRecord[]) => {
        return records.filter(r => {
            if (filters.country && r.countryRef !== filters.country) return false;
            if (filters.state && r.stateRef !== filters.state) return false;
            if (filters.school && r.schoolName !== filters.school) return false;
            if (filters.ageRange) {
                const age = r.age || 0;
                if (filters.ageRange === 'under-12' && age >= 12) return false;
                if (filters.ageRange === '12-15' && (age < 12 || age > 15)) return false;
                if (filters.ageRange === '16-18' && (age < 16 || age > 18)) return false;
                if (filters.ageRange === '18-plus' && age < 18) return false;
            }
            return true;
        });
    };

    const filteredRecords = useMemo(() => {
        if (!stats?.records) return [];
        return filterRecords(stats.records);
    }, [stats?.records, filters]);

    const filteredOnline = useMemo(() => {
        if (!stats?.onlineUsers) return [];
        return filterRecords(stats.onlineUsers as AttendanceRecord[]);
    }, [stats?.onlineUsers, filters]);

    const filteredLoggedIn = filteredRecords.length;
    const filteredOnlineCount = filteredOnline.length;
    const filteredTotalSeconds = filteredRecords.reduce((sum, r) => sum + (r.totalSeconds || 0), 0);
    const filteredTotalHours = Math.round((filteredTotalSeconds / 3600) * 10) / 10;

    // Determine modal content
    const getModalRecords = (): AttendanceRecord[] => {
        if (activeCard === 'loggedIn') return filteredRecords;
        if (activeCard === 'online') return filteredOnline;
        if (activeCard === 'hours') return [...filteredRecords].sort((a, b) => (b.totalSeconds || 0) - (a.totalSeconds || 0));
        return [];
    };

    const dateLabel = isToday ? 'Today' : selectedDate;
    const getModalTitle = () => {
        if (activeCard === 'loggedIn') return `Users Logged In – ${dateLabel}`;
        if (activeCard === 'online') return isToday ? 'Currently Online Users' : `Online Users – ${dateLabel}`;
        if (activeCard === 'hours') return `Time Spent – ${dateLabel}`;
        return '';
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.round((seconds % 3600) / 60);
        return `${hrs}h ${mins}m`;
    };

    const formatLoginTime = (timestamp: any) => {
        if (!timestamp) return '—';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '—';
        }
    };

    const hasActiveFilters = filters.country || filters.state || filters.school || filters.ageRange;

    // Monthly CSV Export
    const exportMonthlyCSV = async () => {
        try {
            setIsExporting(true);
            const dateObj = new Date(selectedDate);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const startPrefix = `${year}-${month}-01`;
            const endPrefix = `${year}-${month}-31`;

            // Query Firestore
            const q = query(
                collection(db, 'user_attendance'),
                where('date', '>=', startPrefix),
                where('date', '<=', endPrefix)
            );
            const snapshot = await getDocs(q);

            const allMonthRecords: AttendanceRecord[] = [];
            snapshot.forEach(doc => {
                allMonthRecords.push(doc.data() as AttendanceRecord);
            });

            // Apply Filters
            const subsetRecords = allMonthRecords.filter(r => {
                if (filters.country && r.countryRef !== filters.country) return false;
                if (filters.state && r.stateRef !== filters.state) return false;
                if (filters.school && r.schoolName !== filters.school) return false;
                if (filters.ageRange) {
                    const age = r.age || 0;
                    if (filters.ageRange === 'under-12' && age >= 12) return false;
                    if (filters.ageRange === '12-15' && (age < 12 || age > 15)) return false;
                    if (filters.ageRange === '16-18' && (age < 16 || age > 18)) return false;
                    if (filters.ageRange === '18-plus' && age < 18) return false;
                }
                return true;
            });

            if (subsetRecords.length === 0) {
                toast.error('No records found for the selected month and filters');
                return;
            }

            // Figure out how many days in the month
            const daysInMonth = new Date(year, dateObj.getMonth() + 1, 0).getDate();

            // Group by userId
            const userGroups = new Map<string, { user: any, dates: Set<string> }>();
            subsetRecords.forEach(r => {
                if (!userGroups.has(r.userId)) {
                    userGroups.set(r.userId, {
                        user: {
                            name: r.displayName || 'Anonymous',
                            school: r.schoolName || '',
                            country: r.countryRef || '',
                            state: r.stateRef || '',
                            age: r.age || '',
                        },
                        dates: new Set()
                    });
                }
                userGroups.get(r.userId)!.dates.add(r.date);
            });

            // Build CSV rows
            const rows: any[] = [];
            userGroups.forEach((data) => {
                const row: any = {
                    "User Name": data.user.name,
                    "School": data.user.school,
                    "State": data.user.state,
                    "Country": data.user.country,
                    "Age": data.user.age,
                };
                for (let d = 1; d <= daysInMonth; d++) {
                    const dateString = `${year}-${month}-${String(d).padStart(2, '0')}`;
                    row[dateString] = data.dates.has(dateString) ? '1' : '0';
                }
                rows.push(row);
            });

            const csv = Papa.unparse(rows);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `attendance_${year}_${month}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Successfully exported attendance CSV');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export CSV');
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Attendance</h2>
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 p-6 mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attendance</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            max={getTodayStr()}
                            className="text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer font-semibold shadow-sm [color-scheme:light] dark:[color-scheme:dark]"
                        />
                        {!isToday && (
                            <button
                                onClick={() => setSelectedDate(getTodayStr())}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                            >
                                Today
                            </button>
                        )}
                        <span className="text-xs text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 font-bold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700">
                            {isToday ? 'Auto-refreshes' : 'Historical'}
                        </span>
                        <button
                            onClick={exportMonthlyCSV}
                            disabled={isExporting}
                            className="ml-2 flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3.5 py-2 rounded-xl transition shadow-sm"
                        >
                            {isExporting ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            )}
                            Export Monthly CSV
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <select
                        value={filters.country}
                        onChange={e => setFilters(p => ({ ...p, country: e.target.value }))}
                        className="text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-semibold"
                    >
                        <option value="" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All Countries</option>
                        {uniqueCountries.map(c => <option key={c} value={c} className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">{c}</option>)}
                    </select>
                    <select
                        value={filters.state}
                        onChange={e => setFilters(p => ({ ...p, state: e.target.value }))}
                        className="text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-semibold"
                    >
                        <option value="" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All States</option>
                        {uniqueStates.map(s => <option key={s} value={s} className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">{s}</option>)}
                    </select>
                    <select
                        value={filters.school}
                        onChange={e => setFilters(p => ({ ...p, school: e.target.value }))}
                        className="text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-semibold"
                    >
                        <option value="" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All Schools</option>
                        {uniqueSchools.map(s => <option key={s} value={s} className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">{s}</option>)}
                    </select>
                    <select
                        value={filters.ageRange}
                        onChange={e => setFilters(p => ({ ...p, ageRange: e.target.value }))}
                        className="text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-semibold"
                    >
                        <option value="" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All Ages</option>
                        <option value="under-12" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">Under 12</option>
                        <option value="12-15" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">12 – 15</option>
                        <option value="16-18" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">16 – 18</option>
                        <option value="18-plus" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">18+</option>
                    </select>
                </div>

                {hasActiveFilters && (
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">Filters active</span>
                        <button
                            onClick={() => setFilters({ country: '', state: '', school: '', ageRange: '' })}
                            className="text-xs text-gray-400 dark:text-slate-400 hover:text-red-500 font-semibold underline"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Logged In Today */}
                    <button
                        onClick={() => setActiveCard('loggedIn')}
                        className="text-left bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/50 p-2.5 rounded-xl group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900 transition">
                                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-emerald-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-emerald-300">{isToday ? 'Logged In Today' : 'Logged In'}</p>
                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{filteredLoggedIn}</p>
                    </button>

                    {/* Currently Online */}
                    <button
                        onClick={() => setActiveCard('online')}
                        className="text-left bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-5 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/50 p-2.5 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-900 transition">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </span>
                                <svg className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-blue-300">Currently Online</p>
                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{filteredOnlineCount}</p>
                    </button>

                    {/* Total Hours Spent */}
                    <button
                        onClick={() => setActiveCard('hours')}
                        className="text-left bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-5 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/50 p-2.5 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-900 transition">
                                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <svg className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-purple-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-purple-300">Total Hours Spent</p>
                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{filteredTotalHours}<span className="text-base font-medium text-gray-400 dark:text-slate-400 ml-1">hrs</span></p>
                    </button>
                </div>
            </div>


            {/* Detail Modal */}
            <Modal
                isOpen={!!activeCard}
                onClose={() => setActiveCard(null)}
                title={getModalTitle()}
                size="lg"
            >
                {activeCard && (
                    <div className="max-h-[60vh] overflow-y-auto">
                        {getModalRecords().length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <p>No users match the current filters</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800/80 sticky top-0 border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Student</th>
                                        {activeCard === 'loggedIn' && (
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Login Time</th>
                                        )}
                                        {activeCard === 'online' && (
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Last Active</th>
                                        )}
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Time Spent</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                    {getModalRecords().map((record, idx) => (
                                        <tr key={`${record.userId}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {record.photoUrl ? (
                                                        <img src={record.photoUrl} alt="" className="w-8 h-8 rounded-full" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/80 rounded-full flex items-center justify-center text-sm font-medium text-indigo-700 dark:text-indigo-300">
                                                            {(record.displayName || 'A').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{record.displayName || 'Anonymous'}</p>
                                                        {record.schoolName && (
                                                            <p className="text-xs text-gray-500 dark:text-slate-400">{record.schoolName}</p>
                                                        )}
                                                    </div>
                                                    {/* Online indicator */}
                                                    {activeCard !== 'online' && stats?.onlineUsers?.some((u: any) => u.userId === record.userId) && (
                                                        <span className="relative flex h-2 w-2 ml-1">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {activeCard === 'loggedIn' && (
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
                                                    {formatLoginTime(record.loginTime)}
                                                </td>
                                            )}
                                            {activeCard === 'online' && (
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">
                                                    {formatLoginTime(record.lastActive)}
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                                                    {formatTime(record.totalSeconds || 0)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
