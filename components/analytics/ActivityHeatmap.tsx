import React from 'react';
import { formatDate } from '@/lib/utils/date';

interface ActivityHeatmapProps {
    data: { date: string; count: number }[];
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    // Generate last 90 days grid
    const today = new Date();
    const days = [];
    for (let i = 89; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const match = data.find(item => item.date === dateStr);
        days.push({
            date: dateStr,
            count: match ? match.count : 0,
            obj: d
        });
    }

    // Determine intensity color
    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100';
        if (count <= 2) return 'bg-green-200';
        if (count <= 5) return 'bg-green-400';
        return 'bg-green-600';
    };

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[600px]">
                <div className="flex gap-1 flex-wrap content-start h-[120px] flex-col">
                    {/* Render grid by columns (weeks) approx. */}
                    {days.map((day) => (
                        <div
                            key={day.date}
                            className={`w-3 h-3 rounded-sm ${getColor(day.count)}`}
                            title={`${day.date}: ${day.count} activities`}
                        />
                    ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>3 Months Ago</span>
                    <span>Today</span>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 justify-end">
                <span>Less</span>
                <div className="w-3 h-3 bg-gray-100 rounded-sm" />
                <div className="w-3 h-3 bg-green-200 rounded-sm" />
                <div className="w-3 h-3 bg-green-400 rounded-sm" />
                <div className="w-3 h-3 bg-green-600 rounded-sm" />
                <span>More</span>
            </div>
        </div>
    );
}
