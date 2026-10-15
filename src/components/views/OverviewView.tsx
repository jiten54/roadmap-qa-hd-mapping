import React from 'react';
import {
  RoadSegment,
  IntersectionNode,
  ValidationIssue
} from '../../types/gis';
import {
  ShieldAlert,
  ShieldCheck,
  Spline,
  GitFork,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  Download,
  PlayCircle,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { ActiveTab } from '../Sidebar';

interface OverviewViewProps {
  segments: RoadSegment[];
  nodes: IntersectionNode[];
  issues: ValidationIssue[];
  onNavigate: (tab: ActiveTab) => void;
  onExportExcel: () => void;
  onRunAudit: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  segments,
  nodes,
  issues,
  onNavigate,
  onExportExcel,
  onRunAudit
}) => {
  // Real calculations
  const totalSegments = segments.length;
  const totalNodes = nodes.length;

  const geoIssues = issues.filter(i => i.category === 'Geometry');
  const connIssues = issues.filter(i => i.category === 'Connectivity');
  const attrIssues = issues.filter(i => i.category === 'Lane Attributes' || i.category === 'Traffic Control');
  const suspiciousNodes = nodes.filter(n => n.suspicious);

  const openIssues = issues.filter(i => i.status === 'Open' || i.status === 'Under Review');
  const resolvedIssues = issues.filter(i => i.status === 'Resolved' || i.status === 'False Positive');

  const criticalIssues = openIssues.filter(i => i.severity === 'Critical');
  const majorIssues = openIssues.filter(i => i.severity === 'Major');
  const minorIssues = openIssues.filter(i => i.severity === 'Minor');
  const advisoryIssues = openIssues.filter(i => i.severity === 'Advisory');

  const totalLengthKm = (segments.reduce((acc, s) => acc + s.lengthMeters, 0) / 1000).toFixed(2);
  const completionPct = issues.length > 0 ? Math.round((resolvedIssues.length / issues.length) * 100) : 100;

  // AV Readiness calculation based on critical blockers
  const isSimulationReady = criticalIssues.length === 0;

  // Road class counts
  const classCounts = segments.reduce((acc, s) => {
    acc[s.roadClass] = (acc[s.roadClass] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Banner: SimForge Operational Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
              SimForge QA Operations Dashboard
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Autonomous Simulation Environment</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Digital Road Network Quality &amp; Topology Validation
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time validation engine verifying physical roadway geometry, topological intersection continuity, lane-level attributes, and routing safety before compilation into SimForge and OpenDRIVE simulation maps.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('map')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Open Map Workspace</span>
          </button>
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Download 10-Sheet Excel QA Audit</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Grid (8 Core Required Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Total Road Segments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Road Segments</span>
            <Spline className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalSegments}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalLengthKm} km total centerline length
          </div>
        </div>

        {/* Metric 2: Total Intersections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Intersections</span>
            <GitFork className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalNodes}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {nodes.filter(n => n.degree >= 3).length} multi-approach junctions
          </div>
        </div>

        {/* Metric 3: Invalid Geometries */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Invalid Geometries</span>
            <span className="text-rose-400 font-mono text-xs font-bold">Rule G01-G05</span>
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {geoIssues.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Microsegments, gaps, acute angles
          </div>
        </div>

        {/* Metric 4: Disconnected Segments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Disconnected Segments</span>
            <span className="text-amber-400 font-mono text-xs font-bold">Rule C01-C02</span>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {connIssues.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Islands and snapping discrepancies
          </div>
        </div>

        {/* Metric 5: Missing Road Attributes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Missing Attributes</span>
            <SlidersHorizontal className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-300 font-mono">
            {attrIssues.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Speed limits, lane counts, markings
          </div>
        </div>

        {/* Metric 6: Potentially Incorrect Intersections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Suspicious Intersections</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-slate-200 font-mono">
            {suspiciousNodes.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Acute convergence or sink traps
          </div>
        </div>

        {/* Metric 7: Validation Completion % */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Validation Completion</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {completionPct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {resolvedIssues.length} of {issues.length} issues signed off
          </div>
        </div>

        {/* Metric 8: Open vs Resolved Issues */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Open vs Resolved</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            <span className="text-rose-400">{openIssues.length}</span> / <span className="text-emerald-400">{resolvedIssues.length}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {criticalIssues.length} simulation blockers
          </div>
        </div>
      </div>

      {/* Main Analysis Section: Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Quality Issue Severity Breakdown & Rules */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Quality Issue Severity Distribution</h3>
              <p className="text-xs text-slate-400">Classified by autonomous driving simulation impact</p>
            </div>
            <button
              onClick={() => onNavigate('quality_review')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              <span>View Review Queue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <span className="text-[11px] font-semibold text-rose-400 block mb-1">Critical (Blockers)</span>
              <div className="text-2xl font-bold text-rose-300 font-mono">{criticalIssues.length}</div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">Must fix before sim engine execution</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[11px] font-semibold text-amber-400 block mb-1">Major (Controllers)</span>
              <div className="text-2xl font-bold text-amber-300 font-mono">{majorIssues.length}</div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">Causes erratic NPC behavior or collision errors</p>
            </div>
            <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <span className="text-[11px] font-semibold text-sky-400 block mb-1">Minor (Attributes)</span>
              <div className="text-2xl font-bold text-sky-300 font-mono">{minorIssues.length}</div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">Missing non-critical road properties</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <span className="text-[11px] font-semibold text-purple-400 block mb-1">Advisory</span>
              <div className="text-2xl font-bold text-purple-300 font-mono">{advisoryIssues.length}</div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">Requires mapping analyst human sign-off</p>
            </div>
          </div>

          {/* Critical Open Issues Table Preview */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Priority Issues Requiring Action
            </div>
            <div className="space-y-1.5">
              {openIssues.slice(0, 4).map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => onNavigate('quality_review')}
                  className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold shrink-0">
                      {issue.ruleCode}
                    </span>
                    <div className="truncate">
                      <span className="font-semibold text-slate-200 block truncate">{issue.title}</span>
                      <span className="text-slate-400 text-[11px] truncate block">{issue.description}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-teal-400 font-semibold shrink-0">Inspect →</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Simulation Readiness & Road Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white">Simulation Readiness</h3>
            <p className="text-xs text-slate-400">SimForge Engine Ingestion Gate</p>
          </div>

          <div className={`p-4 rounded-xl border ${isSimulationReady ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'} text-center space-y-2`}>
            {isSimulationReady ? (
              <>
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-300">PASS: SimForge Simulation Ready</h4>
                <p className="text-[11px] text-slate-300">All critical geometry, topology, and sink trap errors resolved.</p>
              </>
            ) : (
              <>
                <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="text-sm font-bold text-rose-300">FAIL: Ingestion Blocked ({criticalIssues.length} Critical)</h4>
                <p className="text-[11px] text-slate-300">
                  Physical AI simulation engines cannot ingest this map until micro-segments, snapping gaps, and sink traps are resolved.
                </p>
              </>
            )}
          </div>

          {/* Road Network Classification Breakdown */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
              Road Class Inventory
            </span>
            <div className="space-y-1.5 text-xs">
              {Object.entries(classCounts).map(([cls, count]) => (
                <div key={cls} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="capitalize text-slate-300">{cls}</span>
                  <span className="font-mono text-slate-200 font-semibold">{count} segments</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('documentation')}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>Run Automated Rule Tests</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
