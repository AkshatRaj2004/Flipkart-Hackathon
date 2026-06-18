import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, FileSpreadsheet, File } from 'lucide-react';
import { Panel } from '../components/ui/KPICard';
import { downloadPDF, downloadCSV, downloadExcel } from '../services/api';

const REPORT_TYPES = [
  { id: 'traffic_situation', name: 'Traffic Situation Report', desc: 'Comprehensive overview of current traffic conditions' },
  { id: 'congestion', name: 'Congestion Report', desc: 'Detailed congestion analysis by zone and corridor' },
  { id: 'resource_allocation', name: 'Resource Allocation Report', desc: 'Personnel and equipment deployment summary' },
  { id: 'executive_briefing', name: 'Executive Briefing', desc: 'High-level summary for leadership review' },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('traffic_situation');
  const [zone, setZone] = useState('');
  const [loading, setLoading] = useState('');

  const handlePDF = async () => {
    setLoading('pdf');
    try { await downloadPDF(selectedReport, zone || undefined); } catch (e) { console.error(e); }
    setLoading('');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent-cyan" /> Reports & Exports
        </h2>
        <p className="text-sm text-slate-400 mt-1">Generate and export traffic intelligence reports</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Report Configuration">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Report Type</label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {REPORT_TYPES.map(r => (
                  <button key={r.id} onClick={() => setSelectedReport(r.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedReport === r.id
                        ? 'bg-accent-cyan/10 border-accent-cyan/30'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}>
                    <p className="text-sm font-medium text-white">{r.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Zone Filter (optional)</label>
              <input value={zone} onChange={e => setZone(e.target.value)} placeholder="e.g. East Zone 1"
                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent-cyan/50" />
            </div>
          </div>
        </Panel>

        <Panel title="Export Options">
          <div className="space-y-4">
            <button onClick={handlePDF} disabled={loading === 'pdf'}
              className="w-full p-4 rounded-lg bg-white/5 border border-white/10 hover:border-accent-cyan/30 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <File className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Download PDF Report</p>
                <p className="text-[10px] text-slate-500">Executive-ready formatted document</p>
              </div>
              <Download className="w-4 h-4 text-slate-400 ml-auto" />
            </button>

            <button onClick={() => downloadCSV(zone || undefined)}
              className="w-full p-4 rounded-lg bg-white/5 border border-white/10 hover:border-accent-cyan/30 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                <FileSpreadsheet className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Export CSV</p>
                <p className="text-[10px] text-slate-500">Raw event data in comma-separated format</p>
              </div>
              <Download className="w-4 h-4 text-slate-400 ml-auto" />
            </button>

            <button onClick={() => downloadExcel(zone || undefined)}
              className="w-full p-4 rounded-lg bg-white/5 border border-white/10 hover:border-accent-cyan/30 transition-all flex items-center gap-4 group">
              <div className="p-3 rounded-lg bg-accent-cyan/10 group-hover:bg-accent-cyan/20 transition-colors">
                <FileSpreadsheet className="w-6 h-6 text-accent-cyan" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Export Excel</p>
                <p className="text-[10px] text-slate-500">Events + KPI summary workbook</p>
              </div>
              <Download className="w-4 h-4 text-slate-400 ml-auto" />
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
