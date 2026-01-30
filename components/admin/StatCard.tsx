import React from 'react';
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
        yellow: "text-yellow-500 bg-yellow-500/10",
        blue: "text-blue-500 bg-blue-500/10",
        green: "text-green-500 bg-green-500/10",
        purple: "text-purple-500 bg-purple-500/10",
        red: "text-red-500 bg-red-500/10"
    };

    return (
        <div className="bg-[#0A0A0A] p-6 rounded-[2rem] border border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color] || colorClasses.yellow} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                {(trend || subValue) && (
                    <div className="text-right">
                        {trend && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {trend}
                            </span>
                        )}
                        {subValue && (
                            <div className="mt-1">
                                <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-widest">{subLabel}</span>
                                <span className="text-xs font-black text-white">{subValue}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
                <h4 className="text-3xl font-black text-white tabular-nums">{value}</h4>
                {description && <p className="text-[10px] text-gray-500 mt-2 font-medium">{description}</p>}
                {progress !== undefined && (
                    <div className="mt-4 w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
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
