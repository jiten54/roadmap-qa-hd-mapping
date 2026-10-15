import React, { useState } from 'react';
import { RoadSegment, RoadClass, ValidationIssue } from '../../types/gis';
import { Search, Filter, Edit2, Check, X, MapPin, Eye, AlertCircle } from 'lucide-react';

interface RoadInventoryViewProps {
  segments: RoadSegment[];
  issues: ValidationIssue[];
  onUpdateSegment: (updatedSegment: RoadSegment) => void;
  onSelectOnMap: (segment: RoadSegment) => void;
}

export const RoadInventoryView: React.FC<RoadInventoryViewProps> = ({
  segments,
  issues,
  onUpdateSegment,
  onSelectOnMap
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit form state
  const [editLanes, setEditLanes] = useState<number>(2);
  const [editSpeed, setEditSpeed] = useState<number>(50);
  const [editOneWay, setEditOneWay] = useState<boolean>(false);
  const [editSurface, setEditSurface] = useState<'asphalt' | 'concrete' | 'paved' | 'gravel'>('asphalt');

  const startEditing = (seg: RoadSegment) => {
    setEditingId(seg.id);
    setEditLanes(seg.lanes);
    setEditSpeed(seg.speedLimitKph);
    setEditOneWay(seg.isOneWay);
    setEditSurface(seg.surface);
  };

  const saveEditing = (seg: RoadSegment) => {
    onUpdateSegment({
      ...seg,
      lanes: Number(editLanes),
      speedLimitKph: Number(editSpeed),
      isOneWay: editOneWay,
      surface: editSurface,
      avSimReady: Number(editSpeed) > 0 && Number(editLanes) > 0 && Number(editLanes) <= 4
    });
    setEditingId(null);
  };

  const filteredSegments = segments.filter((seg) => {
    const matchesSearch =
      seg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seg.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = classFilter === 'all' || seg.roadClass === classFilter;

    const hasIssues = issues.some(i => i.segmentId === seg.id && (i.status === 'Open' || i.status === 'Under Review'));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'flagged' && hasIssues) ||
      (statusFilter === 'ready' && !hasIssues);

    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Road Segment Inventory</h2>
          <p className="text-xs text-slate-400">
            Geometric records, physical attributes, and simulation readiness statuses ({filteredSegments.length} of {segments.length} segments displayed)
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search street name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 w-52"
            />
          </div>

          {/* Road Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 capitalize"
          >
            <option value="all">All Road Classes</option>
            <option value="motorway">Motorway</option>
            <option value="trunk">Trunk</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="residential">Residential</option>
            <option value="service">Service</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="flagged">Flagged with Issues</option>
            <option value="ready">Simulation Ready</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5">Segment ID</th>
                <th className="py-3 px-3.5">Street Name</th>
                <th className="py-3 px-3.5">Class</th>
                <th className="py-3 px-3.5 text-right">Length (m)</th>
                <th className="py-3 px-3.5 text-center">Lanes</th>
                <th className="py-3 px-3.5 text-right">Speed (kph)</th>
                <th className="py-3 px-3.5">Direction</th>
                <th className="py-3 px-3.5">Surface</th>
                <th className="py-3 px-3.5 text-center">Quality Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSegments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 italic font-sans">
                    No road segments matched the current search or filters.
                  </td>
                </tr>
              ) : (
                filteredSegments.map((seg) => {
                  const isEditing = editingId === seg.id;
                  const segIssues = issues.filter(
                    i => i.segmentId === seg.id && (i.status === 'Open' || i.status === 'Under Review')
                  );
                  const hasIssues = segIssues.length > 0;

                  return (
                    <tr key={seg.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Segment ID */}
                      <td className="py-2.5 px-3.5 text-teal-400 font-semibold text-[11px] whitespace-nowrap">
                        {seg.id}
                      </td>

                      {/* Name */}
                      <td className="py-2.5 px-3.5 font-sans text-slate-200 font-medium whitespace-nowrap">
                        {seg.name}
                      </td>

                      {/* Class */}
                      <td className="py-2.5 px-3.5 font-sans capitalize text-slate-400">
                        {seg.roadClass}
                      </td>

                      {/* Length */}
                      <td className="py-2.5 px-3.5 text-right text-slate-300">
                        {seg.lengthMeters.toFixed(1)}
                      </td>

                      {/* Lanes */}
                      <td className="py-2.5 px-3.5 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={editLanes}
                            onChange={(e) => setEditLanes(parseInt(e.target.value) || 1)}
                            className="w-12 bg-slate-950 border border-teal-500 rounded px-1.5 py-0.5 text-center text-white"
                          />
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[11px] ${seg.lanes > 4 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300'}`}>
                            {seg.lanes}
                          </span>
                        )}
                      </td>

                      {/* Speed Limit */}
                      <td className="py-2.5 px-3.5 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="130"
                            step="5"
                            value={editSpeed}
                            onChange={(e) => setEditSpeed(parseInt(e.target.value) || 0)}
                            className="w-16 bg-slate-950 border border-teal-500 rounded px-1.5 py-0.5 text-right text-white"
                          />
                        ) : (
                          <span className={`${seg.speedLimitKph === 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {seg.speedLimitKph > 0 ? `${seg.speedLimitKph} kph` : 'MISSING'}
                          </span>
                        )}
                      </td>

                      {/* Direction */}
                      <td className="py-2.5 px-3.5 font-sans text-slate-300">
                        {isEditing ? (
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editOneWay}
                              onChange={(e) => setEditOneWay(e.target.checked)}
                              className="rounded accent-teal-500"
                            />
                            <span>One-Way</span>
                          </label>
                        ) : (
                          <span>{seg.isOneWay ? 'One-Way' : 'Two-Way'}</span>
                        )}
                      </td>

                      {/* Surface */}
                      <td className="py-2.5 px-3.5 font-sans capitalize text-slate-400">
                        {isEditing ? (
                          <select
                            value={editSurface}
                            onChange={(e) => setEditSurface(e.target.value as any)}
                            className="bg-slate-950 border border-teal-500 rounded px-1.5 py-0.5 text-xs text-white"
                          >
                            <option value="asphalt">Asphalt</option>
                            <option value="concrete">Concrete</option>
                            <option value="paved">Paved</option>
                            <option value="gravel">Gravel</option>
                          </select>
                        ) : (
                          seg.surface
                        )}
                      </td>

                      {/* Quality Status */}
                      <td className="py-2.5 px-3.5 font-sans text-center">
                        {hasIssues ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" />
                            <span>{segIssues.length} Flagged</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ Ready
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3.5 text-right font-sans whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEditing(seg)}
                                className="p-1 rounded bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
                                title="Save changes"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                                title="Cancel edit"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(seg)}
                                className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-slate-800"
                                title="Edit attributes"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onSelectOnMap(seg)}
                                className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                                title="Locate on map"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
