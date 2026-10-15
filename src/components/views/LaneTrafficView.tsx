import React, { useState } from 'react';
import { RoadSegment, ValidationIssue } from '../../types/gis';
import {
  SlidersHorizontal,
  Compass,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
  Car,
  ShieldCheck,
  Signpost
} from 'lucide-react';

interface LaneTrafficViewProps {
  segments: RoadSegment[];
  issues: ValidationIssue[];
}

export const LaneTrafficView: React.FC<LaneTrafficViewProps> = ({
  segments,
  issues
}) => {
  const laneIssues = issues.filter(
    i => i.category === 'Lane Attributes' || i.category === 'Traffic Control'
  );

  const [activeLaneTab, setActiveLaneTab] = useState<'audit' | 'hd_lanes_demo'>('audit');

  // Demonstration HD Lane Level Dataset (Clearly labeled as synthetic demonstration data for SimForge L4 AV maps)
  const demoHdLanes = [
    { laneId: 'LANE-01-LEFT', parentSegment: 'SEG_01 (Folsom West)', type: 'driving', widthMeters: 3.5, turnDirection: 'through', markingsLeft: 'solid_white', markingsRight: 'dashed_white', speedLimit: 45 },
    { laneId: 'LANE-01-CENTER', parentSegment: 'SEG_01 (Folsom West)', type: 'driving', widthMeters: 3.5, turnDirection: 'through', markingsLeft: 'dashed_white', markingsRight: 'dashed_white', speedLimit: 45 },
    { laneId: 'LANE-01-RIGHT', parentSegment: 'SEG_01 (Folsom West)', type: 'driving', widthMeters: 3.6, turnDirection: 'right_turn_only', markingsLeft: 'dashed_white', markingsRight: 'solid_curb', speedLimit: 45 },
    { laneId: 'LANE-02-BIKE', parentSegment: 'SEG_01 (Folsom West)', type: 'bicycle', widthMeters: 1.8, turnDirection: 'through', markingsLeft: 'solid_green', markingsRight: 'solid_curb', speedLimit: 25 },
    { laneId: 'LANE-HWY-01', parentSegment: 'DET_HWY_01 (West Straight)', type: 'driving', widthMeters: 3.75, turnDirection: 'through', markingsLeft: 'solid_yellow', markingsRight: 'dashed_white', speedLimit: 110 },
    { laneId: 'LANE-HWY-02', parentSegment: 'DET_HWY_01 (West Straight)', type: 'driving', widthMeters: 3.75, turnDirection: 'through', markingsLeft: 'dashed_white', markingsRight: 'dashed_white', speedLimit: 110 },
    { laneId: 'LANE-HWY-03', parentSegment: 'DET_HWY_01 (West Straight)', type: 'driving', widthMeters: 3.75, turnDirection: 'through', markingsLeft: 'dashed_white', markingsRight: 'dashed_white', speedLimit: 110 },
    { laneId: 'LANE-HWY-04', parentSegment: 'DET_HWY_01 (West Straight)', type: 'driving', widthMeters: 3.75, turnDirection: 'through', markingsLeft: 'dashed_white', markingsRight: 'solid_white', speedLimit: 110 }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Attribute Consistency &amp; Traffic Control Governance
          </span>
        </div>
        <h2 className="text-xl font-bold text-white">Lane and Traffic Attribute Validation</h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed mt-1">
          Validates road direction, lawful speed limits, intersection traffic signs, signals, and lane marking presence. Ensures behavioral simulation controllers receive valid parameters without sudden speed drops or one-way traps.
        </p>
      </div>

      {/* Disclaimers & Methodology Notice (Prompt Requirement) */}
      <div className="bg-slate-900 border border-teal-500/30 rounded-xl p-4 flex items-start gap-3 text-xs">
        <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-teal-300 font-semibold block">
            Methodological Boundary: Road Centerlines vs. HD Lane Topology
          </strong>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            In standard GIS workflows (such as OpenStreetMap), ordinary road centerlines store aggregated road-level attributes (e.g., <code>lanes=3</code>, <code>maxspeed=45</code>). Centerlines alone <span className="underline decoration-teal-400 font-medium">do not infer micro-level lane boundary geometries, lane divider markings, or turn-restriction matrices</span>. For autonomous vehicle simulation (SimForge, OpenDRIVE, Lanelet2), micro-level lane graphs are explicitly modeled or ingested as high-definition simulation layers. The tab below demonstrates synthetic HD lane topological data with clear attribution.
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveLaneTab('audit')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeLaneTab === 'audit'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Attribute Validation Audit ({laneIssues.length} Findings)
        </button>
        <button
          onClick={() => setActiveLaneTab('hd_lanes_demo')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeLaneTab === 'hd_lanes_demo'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          HD Lane Demonstration Model (Labeled Synthetic)
        </button>
      </div>

      {activeLaneTab === 'audit' ? (
        <div className="space-y-5">
          {/* Audit Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-medium block mb-1">Speed Limit Completeness</span>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {segments.filter(s => s.speedLimitKph > 0).length} / {segments.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {segments.filter(s => s.speedLimitKph <= 0).length} segments missing lawful speeds
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-medium block mb-1">Directional Integrity</span>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {segments.filter(s => s.isOneWay).length} One-Way Segments
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {issues.filter(i => i.ruleCode === 'L04').length} fatal dead-end vehicle traps flagged
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 font-medium block mb-1">Lane Marking Attribution</span>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {segments.filter(s => s.hasLaneMarkings).length} / {segments.length} Marked
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Required for perception camera simulation</p>
            </div>
          </div>

          {/* Lane & Traffic Issues Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Attribute Validation Findings
            </h3>

            <div className="space-y-2">
              {laneIssues.length === 0 ? (
                <div className="p-4 text-center text-slate-500 italic text-xs">
                  ✓ No lane or traffic attribute issues identified.
                </div>
              ) : (
                laneIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          issue.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {issue.ruleCode} · {issue.severity}
                        </span>
                        <span className="font-semibold text-slate-200">{issue.title}</span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">{issue.segmentId}</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{issue.description}</p>
                    <div className="text-teal-300 text-[11px]">
                      <strong>Corrective Action:</strong> {issue.suggestedAction}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Synthetic HD Lane Model Demonstration */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Demonstration HD Lane-Level Data Model
                </h3>
                <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                  DEMONSTRATION SYNTHETIC DATA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Simulated micro-level lane topology representing Carla OpenDRIVE and SimForge lane boundary format.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Lane ID</th>
                  <th className="py-2.5 px-3">Parent Road Segment</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Width (m)</th>
                  <th className="py-2.5 px-3">Turn Direction</th>
                  <th className="py-2.5 px-3">Left Boundary</th>
                  <th className="py-2.5 px-3">Right Boundary</th>
                  <th className="py-2.5 px-3 text-right">Speed (kph)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {demoHdLanes.map((lane) => (
                  <tr key={lane.laneId} className="hover:bg-slate-850/50">
                    <td className="py-2 px-3 text-teal-400 font-bold">{lane.laneId}</td>
                    <td className="py-2 px-3 font-sans text-slate-300">{lane.parentSegment}</td>
                    <td className="py-2 px-3 font-sans capitalize text-slate-400">{lane.type}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{lane.widthMeters.toFixed(2)}</td>
                    <td className="py-2 px-3 font-sans capitalize text-slate-300">{lane.turnDirection.replace(/_/g, ' ')}</td>
                    <td className="py-2 px-3 font-sans text-[11px] text-slate-400">{lane.markingsLeft}</td>
                    <td className="py-2 px-3 font-sans text-[11px] text-slate-400">{lane.markingsRight}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{lane.speedLimit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
