import { useState, useRef, useEffect } from 'react';

export type SortOption = 'newest' | 'oldest' | 'recents' | 'popular' | 'a-z' | 'z-a';

interface ProgramFiltersProps {
    categories: string[];
    selectedCategories: string[];
    onCategoryChange: (categories: string[]) => void;
    selectedMode: 'all' | 'online' | 'offline';
    onModeChange: (mode: 'all' | 'online' | 'offline') => void;
    selectedSort: SortOption;
    onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'recents', label: 'Recents' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'a-z', label: 'A → Z' },
    { value: 'z-a', label: 'Z → A' },
];

export default function ProgramFilters({
    categories,
    selectedCategories,
    onCategoryChange,
    selectedMode,
    onModeChange,
    selectedSort,
    onSortChange,
}: ProgramFiltersProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setIsSortDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleCategory = (category: string) => {
        if (category === 'All') {
            onCategoryChange(['All']);
            return;
        }

        let newCategories = [...selectedCategories];
        if (newCategories.includes('All')) {
            newCategories = [];
        }

        if (newCategories.includes(category)) {
            newCategories = newCategories.filter(c => c !== category);
        } else {
            newCategories.push(category);
        }

        if (newCategories.length === 0) {
            newCategories = ['All'];
        }

        onCategoryChange(newCategories);
    };

    const getDisplayText = () => {
        if (selectedCategories.includes('All')) return 'All Categories';
        if (selectedCategories.length === 1) return selectedCategories[0];
        return `${selectedCategories.length} Categories Selected`;
    };

    const getSortDisplayText = () => {
        const option = SORT_OPTIONS.find(o => o.value === selectedSort);
        return option?.label || 'Sort By';
    };

    return (
        <div className="relative z-30 bg-white/20 dark:bg-white/5 border-b border-white/10 dark:border-white/10 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">

                    <div className="flex gap-3 w-full sm:w-auto">
                        {/* Category Dropdown */}
                        <div className="relative flex-1 sm:w-52 sm:flex-none" ref={dropdownRef}>
                            <button
                                onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsSortDropdownOpen(false); }}
                                className="w-full flex items-center justify-between px-4 py-2 bg-white/50 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg shadow-sm hover:bg-white/70 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            >
                                <span className="block truncate">
                                    {getDisplayText()}
                                </span>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl max-h-60 rounded-xl py-1 text-base ring-1 ring-black/5 overflow-auto focus:outline-none sm:text-sm backdrop-blur-md">
                                    {categories.map((category) => {
                                        const isSelected = selectedCategories.includes(category);
                                        return (
                                            <button
                                                key={category}
                                                onClick={() => toggleCategory(category)}
                                                className={`w-full text-left cursor-pointer select-none relative py-2 pl-3 pr-9 transition-colors hover:bg-indigo-50 dark:hover:bg-slate-800/80 ${
                                                    isSelected ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold' : 'text-gray-900 dark:text-gray-100 font-medium'
                                                }`}
                                            >
                                                <span className="block truncate">
                                                    {category === 'All' ? 'All Categories' : category}
                                                </span>
                                                {isSelected && (
                                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 dark:text-indigo-400">
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sort By Dropdown */}
                        <div className="relative flex-1 sm:w-44 sm:flex-none" ref={sortDropdownRef}>
                            <button
                                onClick={() => { setIsSortDropdownOpen(!isSortDropdownOpen); setIsDropdownOpen(false); }}
                                className="w-full flex items-center justify-between px-4 py-2 bg-white/50 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg shadow-sm hover:bg-white/70 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            >
                                <span className="flex items-center gap-2 truncate">
                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                    </svg>
                                    {getSortDisplayText()}
                                </span>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform ${isSortDropdownOpen ? 'transform rotate-180' : ''}`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {isSortDropdownOpen && (
                                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl max-h-60 rounded-xl py-1 text-base ring-1 ring-black/5 overflow-auto focus:outline-none sm:text-sm backdrop-blur-md">
                                    {SORT_OPTIONS.map((option) => {
                                        const isSelected = selectedSort === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    onSortChange(option.value);
                                                    setIsSortDropdownOpen(false);
                                                }}
                                                className={`w-full text-left cursor-pointer select-none relative py-2 pl-3 pr-9 transition-colors hover:bg-indigo-50 dark:hover:bg-slate-800/80 ${
                                                    isSelected ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold' : 'text-gray-900 dark:text-gray-100 font-medium'
                                                }`}
                                            >
                                                <span className="block truncate">
                                                    {option.label}
                                                </span>
                                                {isSelected && (
                                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 dark:text-indigo-400">
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mode Filter Toggle */}
                    <div className="flex bg-gray-100/50 dark:bg-white/5 p-1 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-white/10">
                        <button
                            onClick={() => onModeChange('all')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedMode === 'all'
                                ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => onModeChange('online')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedMode === 'online'
                                ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            Online
                        </button>
                        <button
                            onClick={() => onModeChange('offline')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${selectedMode === 'offline'
                                ? 'bg-white dark:bg-white/20 text-orange-600 dark:text-orange-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            Offline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
