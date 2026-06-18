import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts';

const COLORS = ['#00d4ff', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#60a5fa', '#e879f9'];

const tooltipStyle = {
  contentStyle: { background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#94a3b8' },
};

export function DistributionPie({ data, height = 250 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function DistributionBar({ data, height = 250, dataKey = 'value', xKey = 'name' }: { data: Record<string, unknown>[]; height?: number; dataKey?: string; xKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey={dataKey} fill="#00d4ff" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendLine({ data, height = 250 }: { data: { period: string; count: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10 }} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey="count" stroke="#00d4ff" fill="rgba(0,212,255,0.15)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MultiBar({ data, keys, height = 250 }: { data: Record<string, unknown>[]; keys: { key: string; color: string; name: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
        {keys.map(k => <Bar key={k.key} dataKey={k.key} fill={k.color} name={k.name} radius={[2, 2, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBar({ data, height = 300 }: { data: { name: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} width={75} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey="value" fill="#fbbf24" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { COLORS };
