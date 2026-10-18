/**
 * Admin Dashboard Page
 * Platform statistics and user management
 */

'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { usePrograms } from '@/lib/hooks/usePrograms';
import { useUsers, useUpdateUserRole } from '@/lib/hooks/useUsers';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import { toast } from '@/lib/stores/toastStore';
import AttendanceDashboard from '@/components/admin/AttendanceDashboard';
import BackgroundModal from '@/components/admin/BackgroundModal';

export default function AdminPage() {
    const { profile } = useAuth();
    const { data: programsData, isLoading: programsLoading } = usePrograms();
    const { data: users, isLoading: usersLoading } = useUsers();
    const updateUserRole = useUpdateUserRole();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'sub-admin' | 'super-admin'>('all');
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [showBackgroundModal, setShowBackgroundModal] = useState(false);
    const [userTimeRange, setUserTimeRange] = useState('all');

    const TIME_RANGES = [
        { key: '1d', label: '1 Day', days: 1 },
        { key: '1w', label: '1 Week', days: 7 },
        { key: '1m', label: '1 Month', days: 30 },
        { key: '2m', label: '2 Months', days: 60 },
        { key: '3m', label: '3 Months', days: 90 },
        { key: '6m', label: '6 Months', days: 180 },
        { key: '1y', label: '1 Year', days: 365 },
        { key: 'all', label: 'All Time', days: 0 },
    ];

    const getCreatedMs = (u: any): number => {
        if (!u.createdTime) return 0;
        if (u.createdTime.toMillis) return u.createdTime.toMillis();
        if (u.createdTime.seconds) return u.createdTime.seconds * 1000;
        return new Date(u.createdTime).getTime();
    };

    const newUsersFiltered = useMemo(() => {
        if (!users) return [];
        const range = TIME_RANGES.find(t => t.key === userTimeRange);
        if (!range || range.days === 0) return users;
        const cutoff = Date.now() - range.days * 24 * 60 * 60 * 1000;
        return users.filter(u => getCreatedMs(u) >= cutoff);
    }, [users, userTimeRange]);

    const allPrograms = programsData?.pages.flatMap((page: any) => page.programs) ?? [];
    const stats = {
        totalPrograms: allPrograms.length,
        totalUsers: users?.length || 0,
        totalStudents: users?.filter(u => !u.isOrganisation).length || 0,
        totalOrganizations: users?.filter(u => u.isOrganisation).length || 0,
    };

    const filteredUsers = users?.filter(user => {
        const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        switch (filterRole) {
            case 'sub-admin':
                return user.isSubAdmin;
            case 'super-admin':
                return user.isSuperAdmin;
            default:
                return true;
        }
    }) || [];

    const handleRoleUpdate = async (userId: string, updates: { isSubAdmin?: boolean; isSuperAdmin?: boolean }) => {
        try {
            await updateUserRole.mutateAsync({
                userId,
                ...updates
            });
            toast.success(`User role updated successfully`);
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error('Failed to update user role');
        }
    };

    if (!profile?.isOrganisation && !profile?.isSuperAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="text-center bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-w-md w-full">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                    <p className="text-gray-600 dark:text-slate-400 mb-6 font-medium">Only administrators can access this page</p>
                    <Link href="/programs">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Back to Programs</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white py-8 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-1 font-medium">Platform overview and management</p>
                </div>

                {programsLoading || usersLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <button
                                onClick={() => setShowUsersModal(true)}
                                className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 hover:shadow-indigo-500/10 border border-gray-200 dark:border-white/10 hover:border-indigo-500/30 transition-all cursor-pointer text-left w-full"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Total Users</p>
                                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.totalUsers}</p>
                                    </div>
                                    <div className="bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/50 p-3 rounded-xl">
                                        <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </button>

                            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Total Programs</p>
                                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.totalPrograms}</p>
                                    </div>
                                    <div className="bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/50 p-3 rounded-xl">
                                        <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Students</p>
                                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.totalStudents}</p>
                                    </div>
                                    <div className="bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/50 p-3 rounded-xl">
                                        <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Organizations</p>
                                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats.totalOrganizations}</p>
                                    </div>
                                    <div className="bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl">
                                        <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 p-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <Link href="/programs/create" className="w-full">
                                    <Button
                                        fullWidth
                                        variant="outline"
                                        className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 !bg-gray-50/80 dark:!bg-slate-800/90 font-semibold shadow-sm transition-all h-12 rounded-xl"
                                    >
                                        <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Create Program
                                    </Button>
                                </Link>
                                <Link href="/programs/folders" className="w-full">
                                    <Button
                                        fullWidth
                                        variant="outline"
                                        className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 !bg-gray-50/80 dark:!bg-slate-800/90 font-semibold shadow-sm transition-all h-12 rounded-xl"
                                    >
                                        <svg className="w-5 h-5 mr-2 text-cyan-600 dark:text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                        Manage Folders
                                    </Button>
                                </Link>
                                <Link href="/statistics" className="w-full">
                                    <Button
                                        fullWidth
                                        variant="outline"
                                        className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 !bg-gray-50/80 dark:!bg-slate-800/90 font-semibold shadow-sm transition-all h-12 rounded-xl"
                                    >
                                        <svg className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        View Statistics
                                    </Button>
                                </Link>
                                <Link href="/admin/ads" className="w-full">
                                    <Button
                                        fullWidth
                                        variant="outline"
                                        className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 !bg-gray-50/80 dark:!bg-slate-800/90 font-semibold shadow-sm transition-all h-12 rounded-xl"
                                    >
                                        <svg className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                        </svg>
                                        Manage Ads
                                    </Button>
                                </Link>
                                <Button
                                    fullWidth
                                    variant="outline"
                                    onClick={() => setShowBackgroundModal(true)}
                                    className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 !bg-gray-50/80 dark:!bg-slate-800/90 font-semibold shadow-sm transition-all h-12 rounded-xl"
                                >
                                    <svg className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Change Backgrounds
                                </Button>
                            </div>
                        </div>

                        {/* Attendance Dashboard */}
                        <AttendanceDashboard />

                        {/* User Management */}
                        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h2>
                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                    {/* Role Filter */}
                                    <div className="relative">
                                        <select
                                            value={filterRole}
                                            onChange={(e) => setFilterRole(e.target.value as any)}
                                            className="w-full sm:w-auto appearance-none py-2.5 pl-3.5 pr-10 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-semibold shadow-sm"
                                        >
                                            <option value="all" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All Users</option>
                                            <option value="sub-admin" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All Sub-Admins</option>
                                            <option value="super-admin" className="text-gray-900 bg-white dark:text-white dark:bg-slate-900">All Super-Admins</option>
                                        </select>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="relative flex-1 md:flex-none">
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 bg-white dark:bg-slate-800 shadow-sm"
                                        />
                                        <svg className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                                    <thead className="bg-gray-100 dark:bg-slate-800/80">
                                        <tr>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Joined</th>
                                            <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                                        {filteredUsers.map((user) => (
                                            <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            {user.photoUrl ? (
                                                                <img className="h-10 w-10 rounded-full object-cover" src={user.photoUrl} alt="" />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/50">
                                                                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{user.displayName}</div>
                                                            <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${user.isSuperAdmin
                                                        ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50'
                                                        : user.isOrganisation
                                                            ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/50'
                                                            : user.isSubAdmin
                                                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50'
                                                                : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                                                        }`}>
                                                        {user.isSuperAdmin
                                                            ? 'Super Admin'
                                                            : user.isOrganisation
                                                                ? 'Organization'
                                                                : user.isSubAdmin
                                                                    ? 'Sub-Admin'
                                                                    : 'User'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium">
                                                    {user.createdTime ? new Date(
                                                        (user.createdTime as any).seconds * 1000
                                                    ).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {!user.isOrganisation && (
                                                        <div className="flex justify-end gap-3">
                                                            {/* Only Super Admins/Org can make other Super Admins */}
                                                            {(profile?.isSuperAdmin || profile?.isOrganisation) && (
                                                                <button
                                                                    onClick={() => handleRoleUpdate(user.uid, { isSuperAdmin: !user.isSuperAdmin })}
                                                                    className={`text-sm font-bold transition-colors ${user.isSuperAdmin
                                                                        ? 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300'
                                                                        : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300'
                                                                        }`}
                                                                >
                                                                    {user.isSuperAdmin ? 'Revoke Super Admin' : 'Make Super Admin'}
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleRoleUpdate(user.uid, { isSubAdmin: !user.isSubAdmin })}
                                                                className={`text-sm font-bold transition-colors ${user.isSubAdmin
                                                                    ? 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
                                                                    : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300'
                                                                    }`}
                                                            >
                                                                {user.isSubAdmin ? 'Revoke Sub-Admin' : 'Make Sub-Admin'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* New Users Modal */}
                <Modal isOpen={showUsersModal} onClose={() => setShowUsersModal(false)} title="New Users" size="lg">
                    <div className="flex flex-col h-[65vh]">
                        {/* Time Range Pills */}
                        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                            {TIME_RANGES.map(range => (
                                <button
                                    key={range.key}
                                    onClick={() => setUserTimeRange(range.key)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        userTimeRange === range.key
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="flex items-center gap-3 mb-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-3.5 border border-indigo-100 dark:border-indigo-900/50">
                            <div className="bg-indigo-100 dark:bg-indigo-900/60 p-2.5 rounded-lg">
                                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{newUsersFiltered.length}</p>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                    {userTimeRange === 'all'
                                        ? 'users total'
                                        : `new users in the last ${TIME_RANGES.find(t => t.key === userTimeRange)?.label.toLowerCase()}`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {newUsersFiltered.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <p>No new users in this period</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-100 dark:bg-slate-800/80 sticky top-0 border-b border-gray-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">User</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Role</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {[...newUsersFiltered].sort((a, b) => getCreatedMs(b) - getCreatedMs(a)).map(user => (
                                            <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {user.photoUrl ? (
                                                            <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950/80 rounded-full flex items-center justify-center text-sm font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                                                                {(user.displayName || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{user.displayName || 'Anonymous'}</p>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        user.isSuperAdmin ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                                                        : user.isOrganisation ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                                                        : user.isSubAdmin ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                                        : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                                    }`}>
                                                        {user.isSuperAdmin ? 'Super Admin'
                                                            : user.isOrganisation ? 'Organization'
                                                            : user.isSubAdmin ? 'Sub-Admin'
                                                            : 'User'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-slate-400 font-medium">
                                                    {getCreatedMs(user) ? new Date(getCreatedMs(user)).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </Modal>
                
                {/* Background Management Modal */}
                <BackgroundModal 
                    isOpen={showBackgroundModal} 
                    onClose={() => setShowBackgroundModal(false)} 
                />
            </div>
        </div>
    );
}
