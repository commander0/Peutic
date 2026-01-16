import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
}

const SkeletonLoader: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
    const baseStyle = "bg-gray-800 animate-pulse";
    const variantStyle =
        variant === 'circle' ? "rounded-full" :
            variant === 'text' ? "rounded-md h-3" :
                "rounded-2xl";

    return (
        <div className={`${baseStyle} ${variantStyle} ${className}`} />
    );
};

export default SkeletonLoader;

export const CompanionSkeleton = () => (
    <div className="bg-gray-900 rounded-[1.8rem] overflow-hidden border border-gray-800 flex flex-col h-full animate-in fade-in">
        <div className="aspect-[4/5] bg-gray-800 animate-pulse relative" />
        <div className="p-3 border-t border-gray-800 flex justify-between items-center gap-4">
            <SkeletonLoader variant="text" className="w-1/2" />
            <SkeletonLoader variant="rect" className="w-8 h-8 rounded-lg" />
        </div>
    </div>
);

export const StatSkeleton = () => (
    <div className="bg-gray-900 p-5 rounded-3xl border border-gray-800 shadow-sm relative overflow-hidden">
        <SkeletonLoader variant="text" className="w-1/3 mb-2 opacity-50" />
        <div className="flex items-end gap-2 mb-3">
            <SkeletonLoader variant="rect" className="w-1/4 h-8" />
            <SkeletonLoader variant="text" className="w-1/4" />
        </div>
        <SkeletonLoader variant="rect" className="w-full h-2 rounded-full" />
    </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) => (
    <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden animate-in fade-in">
        <div className="bg-gray-900 p-4 border-b border-gray-800 flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
                <SkeletonLoader key={i} variant="text" className="flex-1 opacity-50" />
            ))}
        </div>
        <div className="divide-y divide-gray-800">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-4 flex gap-4">
                    {Array.from({ length: cols }).map((_, j) => (
                        <SkeletonLoader key={j} variant="text" className="flex-1" />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

