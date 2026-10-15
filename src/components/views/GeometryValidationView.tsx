import React from 'react';
import { ValidationIssue, RoadSegment } from '../../types/gis';
import { ValidationConfig, RULE_CATALOG } from '../../utils/validationEngine';
import {
  Spline,
  Sliders,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  Wrench,
  Info
} from 'lucide-react';

interface GeometryValidationViewProps {
  issues: ValidationIssue[];
  config: ValidationConfig;
  onUpdateConfig: (newConfig: ValidationConfig) => void;
  onApplyFix: (issueId: string) => void;
  onNavigateToQueue: () => void;
}

export const GeometryValidationView: React.FC<GeometryValidationViewProps> = ({
  issues,
  config,
  onUpdateConfig,
  onApplyFix,
  onNavigateToQueue
}) => {
  const geoIssues = issues.filter(i => i.category === 'Geometry');
  const genuineErrors = geoIssues.filter(i => !i.requiresHumanVerification);
  const humanReviewNeeded = geoIssues.filter(i => i.requiresHumanVerification);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Geometric Engine · Autonomous Simulation Integrity
          </span>
        </div>
        <h2 className="text-xl font-bold text-white">Road Geometry Validation Engine</h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed mt-1">
          Evaluates centerline coordinates against micro-segment limits, polyline self-intersections, topological snapping gaps, and acute convergence angles. Configurable parameters adapt to urban, highway, and proving-ground operational design domains (ODD).
        </p>
      </div>

      {/* Threshold Configuration Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Simulation Threshold Calibration
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Real-time threshold adjustments re-trigger validation algorithms instantly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Slider 1: Snapping Tolerance */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Endpoint Snapping Tolerance</span>
              <span className="font-mono text-teal-300 font-bold">{config.snappingToleranceMeters.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.5"
              value={config.snappingToleranceMeters}
              onChange={(e) =>
                onUpdateConfig({ ...config, snappingToleranceMeters: parseFloat(e.target.value) })
              }
              className="w-full accent-teal-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 leading-normal">
              Tolerance within which unconnected road endpoints are flagged as near-miss snapping gaps (G04).
            </p>
          </div>

          {/* Slider 2: Micro-segment limit */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Micro-Segment Threshold</span>
              <span className="font-mono text-teal-300 font-bold">{config.minSegmentLengthMeters.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={config.minSegmentLengthMeters}
              onChange={(e) =>
                onUpdateConfig({ ...config, minSegmentLengthMeters: parseFloat(e.target.value) })
              }
              className="w-full accent-teal-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 leading-normal">
              Segments shorter than this threshold (G01) cause trajectory planner numerical breakdown in sim.
            </p>
          </div>

          {/* Slider 3: Acute approach angle */}
          <div className="space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-200">Acute Angle Tolerance</span>
              <span className="font-mono text-teal-300 font-bold">{config.acuteAngleThresholdDegrees.toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="5"
              value={config.acuteAngleThresholdDegrees}
              onChange={(e) =>
                onUpdateConfig({ ...config, acuteAngleThresholdDegrees: parseFloat(e.target.value) })
              }
              className="w-full accent-teal-400 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 leading-normal">
              Junction arms meeting below this angle (G05) violate minimum vehicle turning radius limits.
            </p>
          </div>
        </div>
      </div>

      {/* Rule Verification Distinction Grid: Genuine Errors vs Human Verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Genuine Errors (Deterministic Rule Violations) */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Genuine Geometry Errors ({genuineErrors.length})
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded">
              High Severity
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Deterministic errors that violate simulation map mathematical invariants (e.g., micro-segments and duplicate centerline polylines).
          </p>

          <div className="space-y-2">
            {genuineErrors.map((issue) => (
              <div key={issue.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-rose-400 font-bold">{issue.ruleCode} · {issue.id}</span>
                  <span className="text-slate-500 text-[11px]">Feature: {issue.segmentId || issue.nodeId}</span>
                </div>
                <h4 className="font-semibold text-slate-200">{issue.title}</h4>
                <p className="text-slate-400 text-[11px]">{issue.description}</p>
                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-teal-300 font-medium">{issue.suggestedAction}</span>
                  <button
                    onClick={() => onApplyFix(issue.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 font-semibold"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Simulate Correction</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Human Verification Needed (Potential Issues) */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Human Verification Required ({humanReviewNeeded.length})
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
              Requires Inspection
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Ambiguous physical geometry requiring Mapping Analyst confirmation against high-resolution aerial imagery before modifying road coordinates.
          </p>

          <div className="space-y-2">
            {humanReviewNeeded.map((issue) => (
              <div key={issue.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-amber-400 font-bold">{issue.ruleCode} · {issue.id}</span>
                  <span className="text-slate-500 text-[11px]">Feature: {issue.segmentId || issue.nodeId}</span>
                </div>
                <h4 className="font-semibold text-slate-200">{issue.title}</h4>
                <p className="text-slate-400 text-[11px]">{issue.description}</p>
                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-amber-300/80 font-medium">{issue.suggestedAction}</span>
                  <button
                    onClick={onNavigateToQueue}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium"
                  >
                    <span>Send to Review Queue →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
