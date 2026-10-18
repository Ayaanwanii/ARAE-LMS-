/**
 * Statistics Page
 * Analytics dashboard showing program and user statistics
 */

'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePrograms } from '@/lib/hooks/usePrograms';
import { useUserCounts, useSearchUsers, useFilteredUsers } from '@/lib/hooks/useUsers';
import StudentAnalyticsDashboard from '@/components/analytics/StudentAnalyticsDashboard';
import UserStatsPreview from '@/components/analytics/UserStatsPreview';
import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function StatisticsPage() {
    const { profile } = useAuth();
    const { data } = usePrograms();
    const { data: userCounts } = useUserCounts();

    // Admin Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [selectedStudentName, setSelectedStudentName] = useState<string>('');

    // Filter State
    const [filters, setFilters] = useState({
        country: '',
        state: '',
        school: '',
        ageRange: '',
    });

    // Search Hook
    const { data: searchResults } = useSearchUsers(debouncedSearch);

    // Filtered Users Hook - also provides dropdown options from user profiles
    const { data: filteredData } = useFilteredUsers(filters);

    const isAdmin = profile?.isOrganisation || profile?.isSuperAdmin || profile?.isSubAdmin;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        // Simple debounce
        setTimeout(() => setDebouncedSearch(e.target.value), 500);
    };

    const handleSelectStudent = (userId: string, name: string) => {
        setSelectedStudentId(userId);
        setSelectedStudentName(name);
        setSearchTerm('');
    };

    const allPrograms = data?.pages.flatMap((page: any) => page.programs) ?? [];

    // Category distribution
    const categoryCount: Record<string, number> = {};
    allPrograms.forEach((p: any) => {
        p.category?.forEach((cat: string) => {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
    });

    const topCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5);

    const topPrograms = [...allPrograms]
        .sort((a: any, b: any) => (b.userJoinedNumber || b.userJoined?.length || 0) - (a.userJoinedNumber || a.userJoined?.length || 0))
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white py-8 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Statistics</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-1 font-medium">Platform analytics and insights</p>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mb-8">
                    {/* Program Created */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-200 dark:border-teal-800/50">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Program Created</p>
                                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{allPrograms.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total User */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-200 dark:border-teal-800/50">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total User</p>
                                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{userCounts?.total || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Teachers */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-200 dark:border-teal-800/50">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Teachers</p>
                                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{userCounts?.teachers || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Students */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-200 dark:border-teal-800/50">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Students</p>
                                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{userCounts?.students || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Parents */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-200 dark:border-teal-800/50">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Parents</p>
                                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{userCounts?.parents || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Top Categories */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Categories</h2>
                        <div className="space-y-4">
                            {topCategories.map(([category, count]) => (
                                <div key={category}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{category}</span>
                                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">{count} programs</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5">
                                        <div
                                            className="bg-indigo-600 dark:bg-indigo-400 h-2.5 rounded-full"
                                            style={{ width: `${((count as number) / allPrograms.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {topCategories.length === 0 && (
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 text-center py-6">No categories recorded yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Most Popular Programs */}
                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Most Popular Programs</h2>
                        <div className="space-y-3">
                            {topPrograms.map((program: any, index) => (
                                <div key={program.id} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-700/80">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-full font-bold text-xs border border-indigo-200 dark:border-indigo-800/50">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{program.title}</p>
                                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                                                {program.userJoinedNumber || program.userJoined?.length || 0} participants
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {topPrograms.length === 0 && (
                                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 text-center py-6">No programs found.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- ADMIN: STUDENT LOOKUP --- */}
                {isAdmin && (
                    <div className="border-b border-gray-200 dark:border-slate-800 pb-8 mb-8">
                        {!selectedStudentId && (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Lookup</h2>
                                    <p className="text-gray-600 dark:text-slate-400 font-medium">Find students by filters or search by name</p>
                                </div>

                                {/* Filter Dropdowns */}
                                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10 mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Filter Students</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* Country Filter */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5">Country</label>
                                            <select
                                                value={filters.country}
                                                onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                                                className="w-full text-sm font-semibold bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All Countries</option>
                                                {filteredData?.options.countries.map(c => (
                                                    <option key={c} value={c} className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* State Filter */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5">State</label>
                                            <select
                                                value={filters.state}
                                                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                                                className="w-full text-sm font-semibold bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All States</option>
                                                {filteredData?.options.states.map(s => (
                                                    <option key={s} value={s} className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">{s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* School Filter */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5">School</label>
                                            <select
                                                value={filters.school}
                                                onChange={(e) => setFilters(prev => ({ ...prev, school: e.target.value }))}
                                                className="w-full text-sm font-semibold bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All Schools</option>
                                                {filteredData?.options.schools.map(s => (
                                                    <option key={s} value={s} className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">{s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Age Filter */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 dark:text-white mb-1.5">Age Group</label>
                                            <select
                                                value={filters.ageRange}
                                                onChange={(e) => setFilters(prev => ({ ...prev, ageRange: e.target.value }))}
                                                className="w-full text-sm font-semibold bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl py-2.5 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All Ages</option>
                                                <option value="under-12" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">Under 12</option>
                                                <option value="12-15" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">12 - 15</option>
                                                <option value="16-18" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">16 - 18</option>
                                                <option value="18-plus" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">18+</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Filtered Results */}
                                {(filters.country || filters.state || filters.school || filters.ageRange) && (
                                    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10 mb-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                Filtered Students
                                                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-slate-400">
                                                    ({filteredData?.users.length || 0} results)
                                                </span>
                                            </h3>
                                            <button
                                                onClick={() => setFilters({ country: '', state: '', school: '', ageRange: '' })}
                                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold"
                                            >
                                                Clear filters
                                            </button>
                                        </div>
                                        <div className="max-h-[500px] overflow-y-auto space-y-3">
                                            {filteredData?.users.map(user => (
                                                <button
                                                    key={user.uid}
                                                    className="w-full text-left p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl hover:bg-indigo-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 transition-colors flex flex-col md:flex-row items-start md:items-center gap-4"
                                                    onClick={() => handleSelectStudent(user.uid, user.displayName || user.email || 'Unknown')}
                                                >
                                                    {/* Avatar */}
                                                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg shrink-0 border border-indigo-200 dark:border-indigo-800/50">
                                                        {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                                                    </div>

                                                    {/* Name/Email */}
                                                    <div className="w-48 min-w-0 shrink-0">
                                                        <p className="font-bold text-gray-900 dark:text-white truncate">{user.displayName || user.email}</p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate font-medium">
                                                            {user.displayName && <span className="text-gray-400 dark:text-slate-400">{user.email}</span>}
                                                            {!user.displayName && user.schoolName && <span>{user.schoolName}</span>}
                                                            {user.countryRef && <span> • {user.countryRef}</span>}
                                                        </p>
                                                    </div>

                                                    {/* User Stats Preview */}
                                                    <div className="flex-1 min-w-0 w-full">
                                                        <UserStatsPreview userId={user.uid} />
                                                    </div>

                                                    {/* Chevron arrow */}
                                                    <svg className="w-5 h-5 text-gray-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            ))}
                                            {filteredData?.users.length === 0 && (
                                                <p className="text-gray-500 dark:text-slate-400 text-center py-4 font-medium">No students match the selected filters</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Search Bar */}
                                <div className="max-w-xl mb-6 relative">
                                    <input
                                        type="text"
                                        placeholder="Or search student by name or email..."
                                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium placeholder-gray-400 dark:placeholder-slate-500"
                                        value={searchTerm}
                                        onChange={handleSearch}
                                    />
                                    {/* Dropdown Results */}
                                    {searchTerm.length >= 2 && !selectedStudentId && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 z-50 max-h-60 overflow-y-auto">
                                            {searchResults?.map(user => (
                                                <button
                                                    key={user.uid}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/60 flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 last:border-0 transition-colors"
                                                    onClick={() => handleSelectStudent(user.uid, user.displayName || '')}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm border border-indigo-200 dark:border-indigo-800/50">
                                                        {user.displayName?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white">{user.displayName}</p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{user.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            {searchResults?.length === 0 && (
                                                <div className="px-4 py-3 text-gray-500 dark:text-slate-400 text-sm font-medium">No students found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Selected Student View */}
                        {selectedStudentId && (
                            <div className="animate-fade-in relative">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-1.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-bold border border-indigo-200 dark:border-indigo-800/50">
                                            Viewing Report for: {selectedStudentName}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800"
                                        onClick={() => {
                                            setSelectedStudentId(null);
                                            setSelectedStudentName('');
                                            setSearchTerm('');
                                        }}
                                    >
                                        Close Report
                                    </Button>
                                </div>
                                <StudentAnalyticsDashboard userId={selectedStudentId} />
                            </div>
                        )}
                    </div>
                )}

                {/* --- MY ACTIVITY --- */}
                {profile && !selectedStudentId && (
                    <div className="mb-12">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Activity</h2>
                            <p className="text-gray-600 dark:text-slate-400 font-medium">Your personal learning journey</p>
                        </div>
                        <StudentAnalyticsDashboard userId={profile.uid} />
                    </div>
                )}
            </div>
        </div>
    );
}
