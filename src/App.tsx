/**
 * RoadMap QA — Road Network Mapping & Quality Validation System
 * Tailored for SimForge Mapping QA Analyst & Physical AI Simulation
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  RoadSegment,
  IntersectionNode,
  ValidationIssue,
  AuditLogEntry,
  ReviewStatus
} from './types/gis';
import {
  ALL_BENCHMARK_DATASETS,
  DatasetBundle
} from './data/benchmarkDatasets';
import {
  runValidationSuite,
  DEFAULT_VALIDATION_CONFIG,
  ValidationConfig
} from './utils/validationEngine';
import { generateQualityAuditExcel } from './utils/excelExporter';
import { triggerFileDownload } from './utils/qgisExporter';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { OverviewView } from './components/views/OverviewView';
import { InteractiveMapView } from './components/views/InteractiveMapView';
import { RoadInventoryView } from './components/views/RoadInventoryView';
import { GeometryValidationView } from './components/views/GeometryValidationView';
import { ConnectivityView } from './components/views/ConnectivityView';
import { LaneTrafficView } from './components/views/LaneTrafficView';
import { QualityReviewView } from './components/views/QualityReviewView';
import { ExcelReportsView } from './components/views/ExcelReportsView';
import { DocumentationView } from './components/views/DocumentationView';
import { ImportModal } from './components/ImportModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Active dataset state
  const [datasetId, setDatasetId] = useState<string>('sf_av_urban');
  const [activeDatasetBundle, setActiveDatasetBundle] = useState<DatasetBundle>(
    ALL_BENCHMARK_DATASETS['sf_av_urban']
  );

  // Mutable network state
  const [segments, setSegments] = useState<RoadSegment[]>(
    ALL_BENCHMARK_DATASETS['sf_av_urban'].segments
  );
  const [nodes, setNodes] = useState<IntersectionNode[]>(
    ALL_BENCHMARK_DATASETS['sf_av_urban'].nodes
  );

  // Validation Engine Configuration
  const [config, setConfig] = useState<ValidationConfig>(DEFAULT_VALIDATION_CONFIG);

  // Audit Logs History (Initial sample audit decisions)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'AUDIT-INIT-001',
      issueId: 'SYSTEM',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actor: 'SimForge Pipeline',
      action: 'INGEST_MAP',
      previousStatus: 'Open',
      newStatus: 'Open',
      notes: 'Initial road network ingestion from GIS repository. 26 road segments parsed.'
    }
  ]);

  // Modals & Busy states
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Focus coordinates for map navigation
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    activeDatasetBundle.center
  );

  // Compute validation issues dynamically
  const issues = useMemo(() => {
    return runValidationSuite(segments, nodes, config);
  }, [segments, nodes, config]);

  // Dataset switch handler
  const handleSelectDataset = (id: string) => {
    setDatasetId(id);
    const bundle = ALL_BENCHMARK_DATASETS[id];
    if (bundle) {
      setActiveDatasetBundle(bundle);
      setSegments(bundle.segments);
      setNodes(bundle.nodes);
      setMapCenter(bundle.center);

      setAuditLogs(prev => [
        {
          id: `AUDIT-SWITCH-${Date.now().toString().slice(-4)}`,
          issueId: 'SYSTEM',
          timestamp: new Date().toISOString(),
          actor: 'Mapping Analyst',
          action: 'SWITCH_DATASET',
          previousStatus: 'Open',
          newStatus: 'Open',
          notes: `Loaded benchmark dataset: "${bundle.name}".`
        },
        ...prev
      ]);
    }
  };

  // Re-run validation audit
  const handleRunAudit = useCallback(() => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setAuditLogs(prev => [
        {
          id: `AUDIT-RERUN-${Date.now().toString().slice(-4)}`,
          issueId: 'QA_ENGINE',
          timestamp: new Date().toISOString(),
          actor: 'Mapping Analyst',
          action: 'EXECUTE_AUDIT',
          previousStatus: 'Open',
          newStatus: 'Open',
          notes: `Executed full validation suite: ${issues.length} total quality findings identified.`
        },
        ...prev
      ]);
    }, 300);
  }, [issues.length]);

  // Update Segment inline
  const handleUpdateSegment = (updated: RoadSegment) => {
    setSegments(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    setAuditLogs(prev => [
      {
        id: `AUDIT-EDIT-${Date.now().toString().slice(-4)}`,
        issueId: updated.id,
        timestamp: new Date().toISOString(),
        actor: 'Mapping Analyst',
        action: 'UPDATE_ATTRIBUTES',
        previousStatus: 'Open',
        newStatus: 'Open',
        notes: `Edited segment '${updated.name}': speed=${updated.speedLimitKph} kph, lanes=${updated.lanes}, oneway=${updated.isOneWay}.`
      },
      ...prev
    ]);
  };

  // Apply simulated correction for geometric rule
  const handleApplyFix = (issueId: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    if (issue.ruleCode === 'G01' && issue.segmentId) {
      // Remove micro-segment
      setSegments(prev => prev.filter(s => s.id !== issue.segmentId));
      setAuditLogs(prev => [
        {
          id: `AUDIT-FIX-${Date.now().toString().slice(-4)}`,
          issueId: issue.id,
          timestamp: new Date().toISOString(),
          actor: 'Mapping QA Lead',
          action: 'REMOVE_MICROSEGMENT',
          previousStatus: 'Open',
          newStatus: 'Resolved',
          notes: `Removed sub-3m micro-segment ${issue.segmentId} to prevent simulation solver crash.`
        },
        ...prev
      ]);
    } else if (issue.ruleCode === 'G03' && issue.segmentId) {
      // Consolidate duplicate segment
      setSegments(prev => prev.filter(s => s.id !== issue.segmentId));
      setAuditLogs(prev => [
        {
          id: `AUDIT-FIX-${Date.now().toString().slice(-4)}`,
          issueId: issue.id,
          timestamp: new Date().toISOString(),
          actor: 'Mapping QA Lead',
          action: 'DEDUPLICATE_CENTERLINE',
          previousStatus: 'Open',
          newStatus: 'Resolved',
          notes: `Removed duplicate ghost centerline ${issue.segmentId}.`
        },
        ...prev
      ]);
    } else if (issue.ruleCode === 'L01' && issue.segmentId) {
      // Assign default speed limit
      setSegments(prev =>
        prev.map(s => (s.id === issue.segmentId ? { ...s, speedLimitKph: 45, avSimReady: true } : s))
      );
      setAuditLogs(prev => [
        {
          id: `AUDIT-FIX-${Date.now().toString().slice(-4)}`,
          issueId: issue.id,
          timestamp: new Date().toISOString(),
          actor: 'Mapping QA Lead',
          action: 'SET_DEFAULT_SPEED',
          previousStatus: 'Open',
          newStatus: 'Resolved',
          notes: `Assigned statutory speed limit 45 km/h to segment ${issue.segmentId}.`
        },
        ...prev
      ]);
    } else {
      // Default resolve
      handleUpdateIssueStatus(issue.id, 'Resolved', 'Corrected by Mapping Analyst');
    }
  };

  // Update Review Queue Status
  const handleUpdateIssueStatus = (issueId: string, status: ReviewStatus, notes?: string) => {
    const targetIssue = issues.find(i => i.id === issueId);
    if (targetIssue) {
      targetIssue.status = status;
      if (notes) targetIssue.reviewerNotes = notes;
    }

    setAuditLogs(prev => [
      {
        id: `AUDIT-STATUS-${Date.now().toString().slice(-4)}`,
        issueId,
        timestamp: new Date().toISOString(),
        actor: 'Mapping Analyst',
        action: 'UPDATE_STATUS',
        previousStatus: targetIssue?.status || 'Open',
        newStatus: status,
        notes: notes || `Status updated to ${status}.`
      },
      ...prev
    ]);
  };

  // Add Manual Issue (e.g. from Aerial Inspection Pin tool)
  const handleAddManualIssue = (issuePartial: Partial<ValidationIssue>) => {
    const newIssue: ValidationIssue = {
      id: issuePartial.id || `ISSUE-MANUAL-${Date.now().toString().slice(-4)}`,
      ruleCode: 'VIS_01',
      category: issuePartial.category || 'Visual Aerial Discrepancy',
      severity: issuePartial.severity || 'Major',
      title: issuePartial.title || 'Visual Aerial Inspection Finding',
      description: issuePartial.description || 'Aerial comparison discrepancy recorded during manual review.',
      suggestedAction: issuePartial.suggestedAction || 'Re-align geometry to match imagery.',
      coordinates: issuePartial.coordinates || activeDatasetBundle.center,
      status: 'Open',
      requiresHumanVerification: true
    };

    setAuditLogs(prev => [
      {
        id: `AUDIT-PIN-${Date.now().toString().slice(-4)}`,
        issueId: newIssue.id,
        timestamp: new Date().toISOString(),
        actor: 'Mapping Analyst',
        action: 'ADD_AERIAL_PIN',
        previousStatus: 'Open',
        newStatus: 'Open',
        notes: `Recorded visual aerial discrepancy pin at coordinates [${newIssue.coordinates[0].toFixed(5)}, ${newIssue.coordinates[1].toFixed(5)}].`
      },
      ...prev
    ]);

    setActiveTab('quality_review');
  };

  // Quick Map Navigation
  const handleLocateCoordinates = (coord: [number, number]) => {
    // Leaflet coordinates: [lat, lng]
    setMapCenter([coord[1], coord[0]]);
    setActiveTab('map');
  };

  // Export 10-Sheet Excel Workbook
  const handleExportExcel = () => {
    const buffer = generateQualityAuditExcel(
      segments,
      nodes,
      issues,
      auditLogs,
      activeDatasetBundle.name
    );
    const fileName = `RoadMap_QA_Audit_Report_${activeDatasetBundle.id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    triggerFileDownload(
      buffer,
      fileName,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  };

  // Custom Data Import Success
  const handleImportSuccess = (name: string, newSegs: RoadSegment[], newNodes: IntersectionNode[]) => {
    const customBundle: DatasetBundle = {
      id: `custom_${Date.now()}`,
      name,
      description: 'User-imported GIS road network dataset.',
      locationName: 'Custom Region',
      center: [newSegs[0].coordinates[0][1], newSegs[0].coordinates[0][0]],
      zoom: 16,
      segments: newSegs,
      nodes: newNodes
    };
    setActiveDatasetBundle(customBundle);
    setSegments(newSegs);
    setNodes(newNodes);
    setMapCenter(customBundle.center);
    setDatasetId(customBundle.id);
    setActiveTab('map');

    setAuditLogs(prev => [
      {
        id: `AUDIT-IMP-${Date.now().toString().slice(-4)}`,
        issueId: 'SYSTEM',
        timestamp: new Date().toISOString(),
        actor: 'Mapping Analyst',
        action: 'IMPORT_CUSTOM_GIS',
        previousStatus: 'Open',
        newStatus: 'Open',
        notes: `Imported custom road dataset "${name}" with ${newSegs.length} segments and ${newNodes.length} nodes.`
      },
      ...prev
    ]);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Bar adhering to 3-zone contract */}
      <Navbar
        onRunAudit={handleRunAudit}
        onExportExcel={handleExportExcel}
        activeDatasetName={activeDatasetBundle.name}
        isAuditing={isAuditing}
      />

      {/* Main Workspace with Dark Navy Sidebar & Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          issues={issues}
          datasetId={datasetId}
          onSelectDataset={handleSelectDataset}
          onOpenImport={() => setIsImportModalOpen(true)}
          totalSegments={segments.length}
        />

        <main className="flex-1 overflow-hidden flex flex-col bg-slate-950 relative">
          {activeTab === 'overview' && (
            <OverviewView
              segments={segments}
              nodes={nodes}
              issues={issues}
              onNavigate={setActiveTab}
              onExportExcel={handleExportExcel}
              onRunAudit={handleRunAudit}
            />
          )}

          {activeTab === 'map' && (
            <InteractiveMapView
              segments={segments}
              nodes={nodes}
              issues={issues}
              center={mapCenter}
              zoom={activeDatasetBundle.zoom}
              onUpdateIssueStatus={handleUpdateIssueStatus}
              onAddManualIssue={handleAddManualIssue}
            />
          )}

          {activeTab === 'inventory' && (
            <RoadInventoryView
              segments={segments}
              issues={issues}
              onUpdateSegment={handleUpdateSegment}
              onSelectOnMap={(seg) => handleLocateCoordinates(seg.coordinates[0])}
            />
          )}

          {activeTab === 'geometry' && (
            <GeometryValidationView
              issues={issues}
              config={config}
              onUpdateConfig={setConfig}
              onApplyFix={handleApplyFix}
              onNavigateToQueue={() => setActiveTab('quality_review')}
            />
          )}

          {activeTab === 'connectivity' && (
            <ConnectivityView
              segments={segments}
              nodes={nodes}
              issues={issues}
              snappingToleranceMeters={config.snappingToleranceMeters}
              onLocateFeature={handleLocateCoordinates}
            />
          )}

          {activeTab === 'lane_traffic' && (
            <LaneTrafficView
              segments={segments}
              issues={issues}
            />
          )}

          {activeTab === 'quality_review' && (
            <QualityReviewView
              issues={issues}
              auditLogs={auditLogs}
              onUpdateIssueStatus={handleUpdateIssueStatus}
              onAddManualIssue={handleAddManualIssue}
              onLocateOnMap={handleLocateCoordinates}
            />
          )}

          {activeTab === 'reports' && (
            <ExcelReportsView
              segments={segments}
              nodes={nodes}
              issues={issues}
              auditLogs={auditLogs}
              datasetName={activeDatasetBundle.name}
            />
          )}

          {activeTab === 'documentation' && (
            <DocumentationView />
          )}
        </main>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
