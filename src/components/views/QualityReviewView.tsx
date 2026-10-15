import React, { useState } from 'react';
import {
  ValidationIssue,
  AuditLogEntry,
  ReviewStatus,
  IssueSeverity,
  IssueCategory
} from '../../types/gis';
import {
  ClipboardCheck,
  History,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Filter,
  MessageSquare,
  PlusCircle,
  Save,
  Search
} from 'lucide-react';

interface QualityReviewViewProps {
  issues: ValidationIssue[];
  auditLogs: AuditLogEntry[];
  onUpdateIssueStatus: (issueId: string, status: ReviewStatus, notes?: string) => void;
  onAddManualIssue?: (issue: Partial<ValidationIssue>) => void;
  onLocateOnMap: (coordinates: [number, number]) => void;
}

export const QualityReviewView: React.FC<QualityReviewViewProps> = ({
  issues,
  auditLogs,
  onUpdateIssueStatus,
  onAddManualIssue,
  onLocateOnMap
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(issues[0]?.id || null);
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'audit_trail'>('queue');

  // Edit notes state
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [analystName, setAnalystName] = useState<string>('Mapping Analyst (SimForge)');

  const filteredIssues = issues.filter((i) => {
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
    return matchesStatus && matchesSeverity && matchesCategory;
  });

  const selectedIssue = issues.find(i => i.id === selectedIssueId) || filteredIssues[0] || null;

  const handleStatusChange = (status: ReviewStatus) => {
    if (!selectedIssue) return;
    onUpdateIssueStatus(selectedIssue.id, status, reviewerNotes.trim() || undefined);
    setReviewerNotes('');
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
              Governance &amp; Quality Sign-Off
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Quality Assurance Review Queue</h2>
          <p className="text-xs text-slate-400">
            Audit triage, human verification decisions, and tamper-evident resolution logging
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'queue'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Review Queue ({filteredIssues.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('audit_trail')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeSubTab === 'audit_trail'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail Log ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'queue' ? (
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-5 min-h-0">
          {/* Left Column: Filterable Issues List */}
          <div className="lg:w-7/12 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
            {/* Filters Header */}
            <div className="p-3 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
              >
                <option value="all">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
                <option value="False Positive">False Positive</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
              >
                <option value="all">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
                <option value="Advisory">Advisory</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
              >
                <option value="all">All Categories</option>
                <option value="Geometry">Geometry</option>
                <option value="Connectivity">Connectivity</option>
                <option value="Lane Attributes">Lane Attributes</option>
                <option value="Traffic Control">Traffic Control</option>
                <option value="Visual Aerial Discrepancy">Visual Aerial Discrepancy</option>
              </select>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-1">
              {filteredIssues.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic text-xs">
                  No issues matched the active status or severity filters.
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  const isSelected = selectedIssue?.id === issue.id;
                  const isCritical = issue.severity === 'Critical';
                  const isResolved = issue.status === 'Resolved' || issue.status === 'False Positive';

                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? 'bg-slate-800/90 border border-teal-500/50'
                          : 'hover:bg-slate-850/60 bg-slate-950/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isResolved
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isCritical
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {issue.ruleCode} · {issue.severity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{issue.id}</span>
                        </div>
                        <span className={`text-[10px] font-semibold ${isResolved ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {issue.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-200 truncate">{issue.title}</h4>
                      <p className="text-slate-400 text-[11px] truncate mt-0.5">{issue.description}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Issue Detail & Decision Action Panel */}
          <div className="lg:w-5/12 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col overflow-y-auto">
            {selectedIssue ? (
              <div className="space-y-4 text-xs">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-teal-400 font-bold">{selectedIssue.id}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      Rule: {selectedIssue.ruleCode} ({selectedIssue.category})
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedIssue.title}</h3>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Description &amp; Location
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {selectedIssue.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Coordinates: [{selectedIssue.coordinates[0].toFixed(5)}, {selectedIssue.coordinates[1].toFixed(5)}]</span>
                    <button
                      onClick={() => onLocateOnMap(selectedIssue.coordinates)}
                      className="text-teal-400 hover:text-teal-300 font-sans font-semibold"
                    >
                      View on Map →
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-teal-950/20 border border-teal-500/30 rounded-lg space-y-1">
                  <strong className="text-teal-300 font-semibold block text-[11px]">
                    Suggested Corrective Action:
                  </strong>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {selectedIssue.suggestedAction}
                  </p>
                </div>

                {/* Reviewer Action Box */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-200 block">Record Analyst Decision</span>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Auditor Identity</label>
                    <input
                      type="text"
                      value={analystName}
                      onChange={(e) => setAnalystName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Reviewer Justification Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Add justification or reference imagery observations..."
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleStatusChange('Resolved')}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-semibold transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange('False Positive')}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg font-medium transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>False Positive</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange('Under Review')}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-semibold transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Under Review</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange('Open')}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg font-semibold transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Re-Open</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">
                Select an issue from the queue to review details.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Audit Trail Log View */
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Complete Immutable Decision Audit History ({auditLogs.length} entries)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">SimForge QA Compliance Standard</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Issue ID</th>
                  <th className="py-2.5 px-3">Analyst / Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Status Transition</th>
                  <th className="py-2.5 px-3 font-sans">Analyst Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic font-sans">
                      No status decisions recorded yet. Status changes are permanently recorded here.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/50">
                      <td className="py-2 px-3 text-slate-400 text-[11px]">{log.timestamp.slice(0, 19).replace('T', ' ')}</td>
                      <td className="py-2 px-3 text-teal-400 font-bold">{log.issueId}</td>
                      <td className="py-2 px-3 font-sans text-slate-300">{log.actor}</td>
                      <td className="py-2 px-3 text-slate-300">{log.action}</td>
                      <td className="py-2 px-3">
                        <span className="text-slate-400">{log.previousStatus}</span>
                        <span className="text-teal-400 mx-1">→</span>
                        <span className="text-emerald-400 font-bold">{log.newStatus}</span>
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-300 max-w-xs truncate">{log.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
