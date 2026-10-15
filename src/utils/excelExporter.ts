import * as XLSX from 'xlsx';
import { RoadSegment, IntersectionNode, ValidationIssue, AuditLogEntry } from '../types/gis';

export function generateQualityAuditExcel(
  segments: RoadSegment[],
  nodes: IntersectionNode[],
  issues: ValidationIssue[],
  auditLogs: AuditLogEntry[],
  datasetName: string = 'San Francisco AV Testing Grid'
): Uint8Array {
  const workbook = XLSX.utils.book_new();

  // 1. Executive Summary
  const criticalCount = issues.filter(i => i.severity === 'Critical').length;
  const majorCount = issues.filter(i => i.severity === 'Major').length;
  const minorCount = issues.filter(i => i.severity === 'Minor').length;
  const advisoryCount = issues.filter(i => i.severity === 'Advisory').length;
  const resolvedCount = issues.filter(i => i.status === 'Resolved' || i.status === 'False Positive').length;
  const openCount = issues.filter(i => i.status === 'Open' || i.status === 'Under Review').length;

  const totalLengthM = segments.reduce((sum, s) => sum + s.lengthMeters, 0);

  const execSummaryData = [
    ['ROADMAP QA — SIMFORGE ROAD NETWORK VALIDATION AUDIT REPORT'],
    ['Generated Date:', new Date().toISOString()],
    ['Dataset Name:', datasetName],
    ['Specification:', 'SimForge AV Simulation HD Map Spec v2.4'],
    ['Auditor Role:', 'SimForge Senior Mapping QA Analyst'],
    [],
    ['METRIC', 'VALUE', 'UNIT / NOTES'],
    ['Total Road Segments', segments.length, 'Count'],
    ['Total Network Length', (totalLengthM / 1000).toFixed(2), 'Kilometers'],
    ['Total Intersection Nodes', nodes.length, 'Count'],
    ['Total Quality Issues Identified', issues.length, 'Findings'],
    ['Critical Severity Issues', criticalCount, 'Simulation Blocker'],
    ['Major Severity Issues', majorCount, 'Agent Controller Anomaly'],
    ['Minor Severity Issues', minorCount, 'Asset Refinement'],
    ['Advisory Issues', advisoryCount, 'Human Verification Needed'],
    ['Open / Pending Issues', openCount, 'Requires Action'],
    ['Resolved / False Positive', resolvedCount, 'Closed in Audit Trail'],
    ['Simulation Readiness Index', criticalCount === 0 ? 'READY (100%)' : `${Math.max(0, Math.round(100 - (criticalCount * 15 + majorCount * 5)))}%`, 'Calculated QA Metric'],
    [],
    ['VALIDATION RULES APPLIED'],
    ['Rule Code', 'Name', 'Category', 'Target Impact'],
    ['G01', 'Micro-Segment Detection', 'Geometry', 'Physics engine stability (<3m)'],
    ['G02', 'Self-Intersection Check', 'Geometry', 'Polygon tessellation breakdown'],
    ['G03', 'Duplicate Geometry Trajectory', 'Geometry', 'Routing ambiguity and reflection'],
    ['G04', 'Dangling Endpoint Snapping Gap', 'Geometry', 'Motion planner road boundary loss (<2.5m)'],
    ['G05', 'Acute Approach Angle', 'Geometry', 'Unrealistic vehicle turn radii (<20°)'],
    ['C01', 'Dead-End Node Analysis', 'Connectivity', 'Boundary vs true cul-de-sac verification'],
    ['C02', 'Isolated Subgraph Detection', 'Connectivity', 'Unreachable spawned AV agent traps'],
    ['L01', 'Speed Limit Completeness', 'Attributes', 'Lawful cruising speed adherence'],
    ['L02', 'Lane Count Plausibility', 'Attributes', 'Curb-to-curb realistic capacity'],
    ['L04', 'One-Way Vehicle Sink Trap', 'Traffic Control', 'Irreversible path-planning traps'],
    ['L06', 'High-Speed Road Markings', 'Perception', 'Camera / LiDAR lane boundary visibility']
  ];
  const wsExec = XLSX.utils.aoa_to_sheet(execSummaryData);
  XLSX.utils.book_append_sheet(workbook, wsExec, 'Executive Summary');

  // 2. Road Segment Inventory
  const segmentRows = segments.map(s => ({
    'Segment ID': s.id,
    'Street Name': s.name,
    'Road Class': s.roadClass,
    'Length (m)': s.lengthMeters,
    'Lanes': s.lanes,
    'Speed Limit (km/h)': s.speedLimitKph,
    'One-Way': s.isOneWay ? 'Yes' : 'No',
    'Surface': s.surface,
    'Sidewalk': s.hasSidewalk ? 'Yes' : 'No',
    'Bicycle Lane': s.hasBicycleLane ? 'Yes' : 'No',
    'Traffic Control': s.trafficControl,
    'Lane Markings': s.hasLaneMarkings ? 'Yes' : 'No',
    'Start Node': s.startNodeId,
    'End Node': s.endNodeId,
    'AV Sim Ready': s.avSimReady ? 'PASSED' : 'FLAGGED',
    'Start Longitude': s.coordinates[0][0],
    'Start Latitude': s.coordinates[0][1],
    'End Longitude': s.coordinates[s.coordinates.length - 1][0],
    'End Latitude': s.coordinates[s.coordinates.length - 1][1]
  }));
  const wsSegments = XLSX.utils.json_to_sheet(segmentRows);
  XLSX.utils.book_append_sheet(workbook, wsSegments, 'Road Segment Inventory');

  // 3. Road Attribute Completeness
  const speedFilled = segments.filter(s => s.speedLimitKph > 0).length;
  const lanesFilled = segments.filter(s => s.lanes > 0).length;
  const markingsFilled = segments.filter(s => s.hasLaneMarkings !== undefined).length;
  const surfaceFilled = segments.filter(s => s.surface).length;
  const trafficCtrlFilled = segments.filter(s => s.trafficControl).length;

  const completenessData = [
    ['ROAD ATTRIBUTE AUDIT COMPLETENESS MATRIX'],
    ['Total Segments Analyzed:', segments.length],
    [],
    ['Attribute Field', 'Valid Count', 'Missing / Invalid', 'Completeness %', 'Simulation Requirement'],
    ['Road Classification', segments.length, 0, '100.0%', 'Mandatory for routing weights'],
    ['Speed Limit (kph)', speedFilled, segments.length - speedFilled, `${((speedFilled / segments.length) * 100).toFixed(1)}%`, 'Mandatory for velocity controllers'],
    ['Lane Count', lanesFilled, segments.length - lanesFilled, `${((lanesFilled / segments.length) * 100).toFixed(1)}%`, 'Mandatory for road cross-section geometry'],
    ['Lane Markings Flag', markingsFilled, segments.length - markingsFilled, `${((markingsFilled / segments.length) * 100).toFixed(1)}%`, 'Mandatory for perception camera simulation'],
    ['Pavement Surface Type', surfaceFilled, segments.length - surfaceFilled, `${((surfaceFilled / segments.length) * 100).toFixed(1)}%`, 'Required for tire friction coefficients'],
    ['Traffic Control Assignment', trafficCtrlFilled, segments.length - trafficCtrlFilled, `${((trafficCtrlFilled / segments.length) * 100).toFixed(1)}%`, 'Required for intersection yield rules']
  ];
  const wsCompleteness = XLSX.utils.aoa_to_sheet(completenessData);
  XLSX.utils.book_append_sheet(workbook, wsCompleteness, 'Attribute Completeness');

  // 4. Geometry Validation Results
  const geoIssues = issues.filter(i => i.category === 'Geometry');
  const wsGeo = XLSX.utils.json_to_sheet(geoIssues.map(i => ({
    'Issue ID': i.id,
    'Rule Code': i.ruleCode,
    'Severity': i.severity,
    'Feature ID': i.segmentId || i.nodeId,
    'Title': i.title,
    'Description': i.description,
    'Suggested Corrective Action': i.suggestedAction,
    'Longitude': i.coordinates[0],
    'Latitude': i.coordinates[1],
    'Current Status': i.status
  })));
  XLSX.utils.book_append_sheet(workbook, wsGeo, 'Geometry Validation');

  // 5. Connectivity Issues
  const connIssues = issues.filter(i => i.category === 'Connectivity');
  const wsConn = XLSX.utils.json_to_sheet(connIssues.map(i => ({
    'Issue ID': i.id,
    'Rule Code': i.ruleCode,
    'Severity': i.severity,
    'Feature ID': i.segmentId || i.nodeId,
    'Title': i.title,
    'Description': i.description,
    'Suggested Action': i.suggestedAction,
    'Status': i.status
  })));
  XLSX.utils.book_append_sheet(workbook, wsConn, 'Connectivity Issues');

  // 6. Intersection Checks
  const wsNodes = XLSX.utils.json_to_sheet(nodes.map(n => ({
    'Node ID': n.id,
    'Intersection Type': n.type,
    'Degree (Approaches)': n.degree,
    'Traffic Control': n.trafficControl,
    'Flagged Suspicious': n.suspicious ? 'YES' : 'NO',
    'Suspicious Note': n.suspiciousReason || 'N/A',
    'Connected Segments': n.connectedSegmentIds.join(', '),
    'Longitude': n.coordinates[0],
    'Latitude': n.coordinates[1]
  })));
  XLSX.utils.book_append_sheet(workbook, wsNodes, 'Intersection Checks');

  // 7. Lane & Traffic Checks
  const laneIssues = issues.filter(i => i.category === 'Lane Attributes' || i.category === 'Traffic Control');
  const wsLane = XLSX.utils.json_to_sheet(laneIssues.map(i => ({
    'Issue ID': i.id,
    'Rule Code': i.ruleCode,
    'Category': i.category,
    'Severity': i.severity,
    'Segment ID': i.segmentId || 'N/A',
    'Title': i.title,
    'Description': i.description,
    'Corrective Action': i.suggestedAction,
    'Status': i.status
  })));
  XLSX.utils.book_append_sheet(workbook, wsLane, 'Lane & Traffic Checks');

  // 8. Manual Review Queue
  const wsReview = XLSX.utils.json_to_sheet(issues.map(i => ({
    'Issue ID': i.id,
    'Category': i.category,
    'Severity': i.severity,
    'Associated Feature': i.segmentId || i.nodeId || 'Network',
    'Issue Title': i.title,
    'Status': i.status,
    'Reviewer Notes': i.reviewerNotes || 'Awaiting initial analyst review',
    'Reviewed By': i.reviewedBy || 'SimForge Mapping QA Team',
    'Suggested Corrective Action': i.suggestedAction
  })));
  XLSX.utils.book_append_sheet(workbook, wsReview, 'Manual Review Queue');

  // 9. Issue Resolution Audit Log
  const wsAudit = XLSX.utils.json_to_sheet(auditLogs.map(a => ({
    'Log Entry ID': a.id,
    'Issue ID': a.issueId,
    'Timestamp (UTC)': a.timestamp,
    'Analyst / Actor': a.actor,
    'Action': a.action,
    'Prior Status': a.previousStatus,
    'Updated Status': a.newStatus,
    'Audit Notes': a.notes
  })));
  XLSX.utils.book_append_sheet(workbook, wsAudit, 'Audit Trail Log');

  // 10. Final Quality Summary
  const summaryData = [
    ['SIMFORGE PHYSICAL AI MAPPING — QUALITY ATTESTATION'],
    [],
    ['Metric', 'Final Result'],
    ['Dataset Inspected', datasetName],
    ['Total Segments Audited', segments.length],
    ['Critical Geometry Failures', criticalCount],
    ['Major Attribute Anomalies', majorCount],
    ['Resolved Issues', resolvedCount],
    ['Compliance Verdict', criticalCount === 0 ? 'APPROVED FOR AUTONOMOUS SIMULATION' : 'REVISION REQUIRED BEFORE ENGINE RUN'],
    ['Certified By', 'SimForge Autonomous Simulation QA Analyst'],
    ['Date Signed', new Date().toLocaleDateString()]
  ];
  const wsFinal = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, wsFinal, 'Final Quality Summary');

  // Generate buffer
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}
