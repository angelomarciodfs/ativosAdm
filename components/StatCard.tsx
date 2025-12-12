import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'brand' | 'blue' | 'red' | 'green';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, color = 'brand' }) => {
  const styles = {
    brand: {
      text: 'text-brand-600',
      bg: 'bg-brand-50',
      border: 'border-brand-100'
    },
    blue: {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    red: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100'
    },
    green: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    }
  };

  const currentStyle = styles[color];

  return (
    <div className={`p-6 rounded-xl border bg-white ${currentStyle.border} transition-all duration-300 shadow-sm hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${currentStyle.bg} ${currentStyle.text}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="ml-2 text-gray-400">vs mês anterior</span>
        </div>
      )}
    </div>
  );
};