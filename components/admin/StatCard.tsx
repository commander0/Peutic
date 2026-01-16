import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    description?: string;
    color?: string;
    subValue?: string | number;
    subLabel?: string;
    progress?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, description, color = "yellow", subValue, subLabel, progress }) => {
    const colorClasses: Record<string, string> = {
        yellow: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
        blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
        green: "text-green-600 bg-green-50 dark:bg-green-900/20",
        purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
        red: "text-red-600 bg-red-50 dark:bg-red-900/20"
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color] || colorClasses.yellow} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                {(trend || subValue) && (
                    <div className="text-right">
                        {trend && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {trend}
                            </span>
                        )}
                        {subValue && (
                            <div className="mt-1">
                                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">{subLabel}</span>
                                <span className="text-xs font-black dark:text-white">{subValue}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
                <h4 className="text-3xl font-black dark:text-white tabular-nums">{value}</h4>
                {description && <p className="text-[10px] text-gray-400 mt-2 font-medium">{description}</p>}
                {progress !== undefined && (
                    <div className="mt-4 w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' : color === 'purple' ? 'bg-purple-500' : 'bg-yellow-400'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};


export default StatCard;
