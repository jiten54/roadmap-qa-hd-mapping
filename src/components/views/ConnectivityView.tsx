import React from 'react';
import { RoadSegment, IntersectionNode, ValidationIssue } from '../../types/gis';
import { GitFork, Network, AlertOctagon, CornerDownRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ConnectivityViewProps {
  segments: RoadSegment[];
  nodes: IntersectionNode[];
  issues: ValidationIssue[];
  snappingToleranceMeters: number;
  onLocateFeature: (coordinates: [number, number]) => void;
}

export const ConnectivityView: React.FC<ConnectivityViewProps> = ({
  segments,
  nodes,
  issues,
  snappingToleranceMeters,
  onLocateFeature
}) => {
  const connIssues = issues.filter(i => i.category === 'Connectivity');
  const isolatedIslands = issues.filter(i => i.ruleCode === 'C02');
  const deadEnds = issues.filter(i => i.ruleCode === 'C01');
  const snappingGaps = issues.filter(i => i.ruleCode === 'G04');

  // Node degree breakdown
  const degreeCounts = nodes.reduce((acc, n) => {
    acc[n.degree] = (acc[n.degree] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Graph Topology &amp; Network Continuity
          </span>
        </div>
        <h2 className="text-xl font-bold text-white">Road Connectivity Analysis</h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed mt-1">
          Constructs a planar mathematical graph $G = (V, E)$ from road endpoints using a metric snapping tolerance of{' '}
          <strong className="text-teal-300 font-mono">{snappingToleranceMeters}m</strong>. Identifies disconnected graph components, dead-end cutoffs, and sink vertices where autonomous simulation vehicles would fail global routing.
        </p>
      </div>

      {/* Network Topology KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Graph Vertices (Nodes)</span>
          <div className="text-2xl font-bold text-white font-mono">{nodes.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Snapping resolution: {snappingToleranceMeters}m</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Graph Edges (Centerlines)</span>
          <div className="text-2xl font-bold text-white font-mono">{segments.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {segments.filter(s => s.isOneWay).length} directed, {segments.filter(s => !s.isOneWay).length} bidirectional
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Isolated Components</span>
          <div className={`text-2xl font-bold font-mono ${isolatedIslands.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isolatedIslands.length > 0 ? `${isolatedIslands.length} Islands` : '0 (Connected)'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Subgraphs with zero exit edge</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Dead-End Stubs (Degree 1)</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">{deadEnds.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Require turnaround confirmation</p>
        </div>
      </div>

      {/* Graph Node Degree Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4 text-teal-400" />
            <span>Intersection Approach Degree Distribution</span>
          </h3>
          <span className="text-[11px] text-slate-400">Total Junction Nodes: {nodes.length}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {[1, 2, 3, 4, 5].map((deg) => {
            const count = degreeCounts[deg] || 0;
            return (
              <div key={deg} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                <div className="text-slate-400 text-[11px] font-medium mb-1">
                  Degree {deg} {deg === 1 ? '(Dead End)' : deg === 2 ? '(Through)' : deg === 3 ? '(T-Junction)' : deg === 4 ? '(4-Way Cross)' : '(Complex 5+)'}
                </div>
                <div className="text-xl font-bold text-slate-100 font-mono">{count}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {nodes.length > 0 ? ((count / nodes.length) * 100).toFixed(0) : 0}% of junctions
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Connectivity Issues Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Network Topology Findings &amp; Discontinuities ({connIssues.length + snappingGaps.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Flagged graph anomalies that obstruct global routing and autonomous simulation vehicle transitions
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          {[...connIssues, ...snappingGaps].map((issue) => (
            <div
              key={issue.id}
              className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    issue.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {issue.ruleCode} · {issue.severity}
                  </span>
                  <span className="font-semibold text-slate-200">{issue.title}</span>
                </div>
                <p className="text-slate-400 text-[11px]">{issue.description}</p>
                <div className="text-[11px] text-teal-300">
                  <strong>Recommended Remedy:</strong> {issue.suggestedAction}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => onLocateFeature(issue.coordinates)}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors"
                >
                  Locate on Map →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
