import React, { useState } from 'react';
import { RoadSegment, IntersectionNode, ValidationIssue, AuditLogEntry } from '../../types/gis';
import {
  generateQualityAuditExcel
} from '../../utils/excelExporter';
import {
  exportRoadCenterlinesGeoJSON,
  exportIssuesGeoJSON,
  exportSegmentsCSV,
  triggerFileDownload
} from '../../utils/qgisExporter';
import {
  FileSpreadsheet,
  Download,
  Layers,
  FileCode,
  Table,
  CheckCircle2,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface ExcelReportsViewProps {
  segments: RoadSegment[];
  nodes: IntersectionNode[];
  issues: ValidationIssue[];
  auditLogs: AuditLogEntry[];
  datasetName: string;
}

export const ExcelReportsView: React.FC<ExcelReportsViewProps> = ({
  segments,
  nodes,
  issues,
  auditLogs,
  datasetName
}) => {
  const [activeSheetTab, setActiveSheetTab] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const sheets = [
    { id: 0, title: '1. Executive Summary', count: '17 KPI metrics' },
    { id: 1, title: '2. Road Segment Inventory', count: `${segments.length} records` },
    { id: 2, title: '3. Attribute Completeness', count: '6 core fields' },
    { id: 3, title: '4. Geometry Validation', count: `${issues.filter(i => i.category === 'Geometry').length} findings` },
    { id: 4, title: '5. Connectivity Issues', count: `${issues.filter(i => i.category === 'Connectivity').length} findings` },
    { id: 5, title: '6. Intersection Checks', count: `${nodes.length} nodes` },
    { id: 6, title: '7. Lane & Traffic Checks', count: `${issues.filter(i => i.category === 'Lane Attributes' || i.category === 'Traffic Control').length} findings` },
    { id: 7, title: '8. Manual Review Queue', count: `${issues.length} total issues` },
    { id: 8, title: '9. Audit Trail Log', count: `${auditLogs.length} events` },
    { id: 9, title: '10. Final Quality Summary', count: 'Sign-off attestation' }
  ];

  const handleDownloadExcel = () => {
    setIsExporting(true);
    try {
      const buffer = generateQualityAuditExcel(segments, nodes, issues, auditLogs, datasetName);
      const fileName = `RoadMap_QA_Audit_Report_${datasetName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      triggerFileDownload(
        buffer,
        fileName,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadGeoJSON = () => {
    const geojson = exportRoadCenterlinesGeoJSON(segments);
    triggerFileDownload(
      JSON.stringify(geojson, null, 2),
      `RoadMap_Centerlines_${datasetName.replace(/\s+/g, '_')}.geojson`,
      'application/geo+json'
    );
  };

  const handleDownloadIssuesGeoJSON = () => {
    const geojson = exportIssuesGeoJSON(issues);
    triggerFileDownload(
      JSON.stringify(geojson, null, 2),
      `RoadMap_Quality_Issues_${datasetName.replace(/\s+/g, '_')}.geojson`,
      'application/geo+json'
    );
  };

  const handleDownloadCSV = () => {
    const csv = exportSegmentsCSV(segments);
    triggerFileDownload(
      csv,
      `RoadMap_Inventory_${datasetName.replace(/\s+/g, '_')}.csv`,
      'text/csv'
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
            Structured Quality Reporting &amp; GIS Interoperability
          </span>
        </div>
        <h2 className="text-xl font-bold text-white">Excel Quality Reporting &amp; GIS Exports</h2>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed mt-1">
          Generates comprehensive multi-sheet Microsoft Excel (.xlsx) quality reports for stakeholders, as well as QGIS-compatible GeoJSON and CSV packages conforming to SimForge autonomous driving simulation specifications.
        </p>
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Primary Download: 10-Sheet Excel */}
        <div className="bg-slate-900 border border-teal-500/40 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">10-Sheet Excel QA Report</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Complete audit workbook with Executive Summary, Geometry results, Attribute matrices, and Audit logs.
            </p>
          </div>
          <button
            onClick={handleDownloadExcel}
            disabled={isExporting}
            className="mt-4 w-full py-2 px-3 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .XLSX</span>
          </button>
        </div>

        {/* QGIS Road Centerlines GeoJSON */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Road Centerlines GeoJSON</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              WGS84 EPSG:4326 LineString vectors ready for drag-and-drop ingestion into QGIS, ArcGIS, or Blender-GIS.
            </p>
          </div>
          <button
            onClick={handleDownloadGeoJSON}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Centerlines .GeoJSON</span>
          </button>
        </div>

        {/* QGIS Issue Markers GeoJSON */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Quality Issue Markers</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Point geometry features of all flagged issues with severity, rule codes, and recommended actions.
            </p>
          </div>
          <button
            onClick={handleDownloadIssuesGeoJSON}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Issue Points .GeoJSON</span>
          </button>
        </div>

        {/* Road Inventory CSV */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-3">
              <Table className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Road Inventory CSV</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Tabular export with segment properties and WKT (Well-Known Text) geometries for database pipelines.
            </p>
          </div>
          <button
            onClick={handleDownloadCSV}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Inventory .CSV</span>
          </button>
        </div>
      </div>

      {/* Excel Sheet Structure & Live Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Excel Workbook Architecture (10 Structured Worksheets)
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any sheet to inspect its generated column schemas and audit contents
            </p>
          </div>
        </div>

        {/* Sheet Tabs */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800/60">
          {sheets.map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => setActiveSheetTab(sheet.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                activeSheetTab === sheet.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <div>{sheet.title}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{sheet.count}</div>
            </button>
          ))}
        </div>

        {/* Sheet Content Preview Area */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono space-y-3">
          {activeSheetTab === 0 && (
            <div className="space-y-2">
              <div className="text-teal-400 font-bold font-sans text-sm">Sheet 1: Executive Summary</div>
              <p className="text-slate-400 text-xs font-sans">
                Aggregated audit metrics, simulation blocker counts, compliance percentages, and catalog of applied validation rules.
              </p>
              <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] pt-2">
                <div>Total Segments: {segments.length}</div>
                <div>Total Intersection Nodes: {nodes.length}</div>
                <div>Critical Blocker Issues: {issues.filter(i => i.severity === 'Critical').length}</div>
                <div>Resolved Issues: {issues.filter(i => i.status === 'Resolved' || i.status === 'False Positive').length}</div>
              </div>
            </div>
          )}

          {activeSheetTab === 1 && (
            <div className="space-y-2">
              <div className="text-teal-400 font-bold font-sans text-sm">Sheet 2: Road Segment Inventory</div>
              <p className="text-slate-400 text-xs font-sans">
                Complete inventory: Segment ID, Street Name, Class, Length (m), Lanes, Speed Limit, One-Way, Surface, AV Sim Ready flag.
              </p>
              <div className="text-slate-300 text-[11px]">
                Columns: Segment ID | Street Name | Road Class | Length (m) | Lanes | Speed Limit | One-Way | Surface | AV Sim Ready
              </div>
            </div>
          )}

          {activeSheetTab === 2 && (
            <div className="space-y-2">
              <div className="text-teal-400 font-bold font-sans text-sm">Sheet 3: Road Attribute Completeness</div>
              <p className="text-slate-400 text-xs font-sans">
                Completeness percentages for classification, lawful speeds, lane counts, markings, surface friction, and traffic controls.
              </p>
            </div>
          )}

          {activeSheetTab >= 3 && (
            <div className="space-y-2">
              <div className="text-teal-400 font-bold font-sans text-sm">
                {sheets[activeSheetTab].title}
              </div>
              <p className="text-slate-400 text-xs font-sans">
                Full structured tabular dataset included in the exported Microsoft Excel workbook.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
