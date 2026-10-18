import React, { useMemo } from 'react';

interface KnowledgeRadarProps {
    data: { category: string; count: number }[];
}

export default function KnowledgeRadar({ data }: KnowledgeRadarProps) {
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        // Determine max value for normalization
        const max = Math.max(...data.map(d => d.count)) || 1;
        // Pad with placeholders if less than 3 dims (to make a polygon)
        let chartData = [...data];
        if (chartData.length < 3) {
            const placeholders = 3 - chartData.length;
            for (let i = 0; i < placeholders; i++) {
                chartData.push({ category: '', count: 0 });
            }
        }
        return chartData.map(d => ({ ...d, value: d.count / max }));
    }, [data]);

    const size = 300;
    const center = size / 2;
    const radius = 100;

    const points = processedData.map((d, i) => {
        const angle = (Math.PI * 2 * i) / processedData.length - Math.PI / 2;
        const x = center + radius * d.value * Math.cos(angle);
        const y = center + radius * d.value * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    const gridLevels = [0.25, 0.5, 0.75, 1];

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-slate-400 text-sm font-medium">
                No interest data available yet
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[300px]">
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
                    {/* Background Grid */}
                    {gridLevels.map((level, idx) => (
                        <circle
                            key={idx}
                            cx={center}
                            cy={center}
                            r={radius * level}
                            fill="none"
                            className="stroke-gray-300 dark:stroke-slate-700"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Data Polygon */}
                    <polygon
                        points={points}
                        fill="rgba(99, 102, 241, 0.25)"
                        className="stroke-indigo-600 dark:stroke-indigo-400"
                        strokeWidth="2"
                    />

                    {/* Points & Labels */}
                    {processedData.map((d, i) => {
                        const angle = (Math.PI * 2 * i) / processedData.length - Math.PI / 2;
                        const x = center + (radius + 20) * Math.cos(angle);
                        const y = center + (radius + 20) * Math.sin(angle);

                        return (
                            <g key={i}>
                                {d.category && (
                                    <text
                                        x={x}
                                        y={y}
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        className="text-[10px] fill-gray-700 dark:fill-slate-300 font-bold"
                                        style={{ fontSize: '10px' }}
                                    >
                                        {d.category}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 font-medium">Based on joined program categories</p>
        </div>
    );
}

