import React from 'react';
import { ShieldCheck, Play, Download, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onRunAudit: () => void;
  onExportExcel: () => void;
  activeDatasetName: string;
  isAuditing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRunAudit,
  onExportExcel,
  activeDatasetName,
  isAuditing = false
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 shrink-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white leading-none">
            RoadMap QA
          </span>
          <span className="text-[11px] text-slate-400 font-mono tracking-tight mt-0.5">
            SimForge Physical AI Network Validator
          </span>
        </div>
      </div>

      {/* Zone 2: Concise single-line navigation indicators */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-400 font-medium">
        <span className="truncate max-w-xs text-slate-300">
          Active: <strong className="text-teal-300 font-semibold">{activeDatasetName}</strong>
        </span>
        <span aria-hidden="true" className="text-slate-700">·</span>
        <span>EPSG:4326 (WGS84) Geodesic</span>
        <span aria-hidden="true" className="text-slate-700">·</span>
        <span>SimForge Spec v2.4</span>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onRunAudit}
          disabled={isAuditing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
          title="Run full geometry, connectivity, and attribute validation suite"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing...' : 'Re-Run QA Engine'}</span>
        </button>

        <button
          onClick={onExportExcel}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          title="Download 10-sheet Excel Audit Workbook"
        >
          <Download className="w-3.5 h-3.5 text-slate-950" />
          <span>Export Excel Report</span>
        </button>
      </div>
    </header>
  );
};
