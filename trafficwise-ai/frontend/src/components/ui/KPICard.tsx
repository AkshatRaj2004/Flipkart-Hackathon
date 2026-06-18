import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  delay?: number;
  subtitle?: string;
}

export default function KPICard({ label, value, icon: Icon, color = 'text-accent-cyan', delay = 0, subtitle }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.4 }}
      className="glass-panel-hover p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="kpi-label">{label}</p>
          <p className="kpi-value mt-1">{value}</p>
          {subtitle && <p className="text-[10px] text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}

export function Panel({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`glass-panel p-4 ${className}`}>
      {title && <h3 className="section-title mb-4">{title}</h3>}
      {children}
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${colors[severity] || colors.low}`}>
      {severity}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const isHigh = priority === 'High';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${
      isHigh ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }`}>
      {priority}
    </span>
  );
}

export function RiskGauge({ score, size = 120 }: { score: number; size?: number }) {
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#fbbf24' : '#22c55e';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(score)}</span>
        <span className="text-[9px] uppercase tracking-widest text-slate-400">Risk</span>
      </div>
    </div>
  );
}
