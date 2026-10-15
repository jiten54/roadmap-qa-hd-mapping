import React from 'react';
import {
  LayoutDashboard,
  Map,
  TableProperties,
  Spline,
  GitFork,
  SlidersHorizontal,
  ClipboardCheck,
  FileSpreadsheet,
  BookOpen,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FolderGit2
} from 'lucide-react';
import { ValidationIssue } from '../types/gis';

export type ActiveTab =
  | 'overview'
  | 'map'
  | 'inventory'
  | 'geometry'
  | 'connectivity'
  | 'lane_traffic'
  | 'quality_review'
  | 'reports'
  | 'documentation';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  issues: ValidationIssue[];
  datasetId: string;
  onSelectDataset: (datasetId: string) => void;
  onOpenImport: () => void;
  totalSegments: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  issues,
  datasetId,
  onSelectDataset,
  onOpenImport,
  totalSegments
}) => {
  const openIssues = issues.filter(i => i.status === 'Open' || i.status === 'Under Review');
  const criticalCount = openIssues.filter(i => i.severity === 'Critical').length;
  const majorCount = openIssues.filter(i => i.severity === 'Major').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved' || i.status === 'False Positive').length;

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: '1. Overview', icon: LayoutDashboard },
    { id: 'map', label: '2. Interactive Map', icon: Map },
    { id: 'inventory', label: '3. Road Inventory', icon: TableProperties, badge: totalSegments },
    { id: 'geometry', label: '4. Geometry Validation', icon: Spline, badge: issues.filter(i => i.category === 'Geometry' && (i.status === 'Open' || i.status === 'Under Review')).length, badgeColor: 'bg-rose-500/20 text-rose-300' },
    { id: 'connectivity', label: '5. Connectivity Analysis', icon: GitFork, badge: issues.filter(i => i.category === 'Connectivity' && (i.status === 'Open' || i.status === 'Under Review')).length, badgeColor: 'bg-amber-500/20 text-amber-300' },
    { id: 'lane_traffic', label: '6. Lane & Traffic Attributes', icon: SlidersHorizontal, badge: issues.filter(i => (i.category === 'Lane Attributes' || i.category === 'Traffic Control') && (i.status === 'Open' || i.status === 'Under Review')).length, badgeColor: 'bg-teal-500/20 text-teal-300' },
    { id: 'quality_review', label: '7. Quality Review Queue', icon: ClipboardCheck, badge: openIssues.length, badgeColor: 'bg-rose-500/20 text-rose-300' },
    { id: 'reports', label: '8. Excel Reports & Exports', icon: FileSpreadsheet },
    { id: 'documentation', label: '9. Documentation & Tests', icon: BookOpen }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Dataset Selector Section */}
      <div className="p-4 border-b border-slate-800/80">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Active Road Network
        </label>
        <select
          value={datasetId}
          onChange={(e) => onSelectDataset(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        >
          <option value="sf_av_urban">SF AV Urban Proving Grid (26 segs)</option>
          <option value="detroit_proving_ground">Detroit Proving Ground (Highway)</option>
        </select>

        <button
          onClick={onOpenImport}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-750 hover:text-white border border-slate-700/60 rounded-lg transition-colors"
        >
          <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
          <span>Import Custom GIS Data</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Validation Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.badgeColor || 'bg-slate-800 text-slate-400'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quality Summary Footer Strip */}
      <div className="p-3.5 bg-slate-950/70 border-t border-slate-800/80 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-[11px] font-medium">Simulation Blockers:</span>
          <span className="font-mono text-rose-400 font-bold">{criticalCount} Critical</span>
        </div>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-medium">Resolved in Audit:</span>
          <span className="font-mono text-emerald-400 font-bold">{resolvedCount} Issues</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{
              width: `${issues.length > 0 ? (resolvedCount / issues.length) * 100 : 100}%`
            }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
          <span>Resolution Progress</span>
          <span>{issues.length > 0 ? Math.round((resolvedCount / issues.length) * 100) : 100}%</span>
        </div>
      </div>
    </aside>
  );
};
