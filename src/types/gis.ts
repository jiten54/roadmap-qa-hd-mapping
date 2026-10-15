export type RoadClass =
  | 'motorway'
  | 'trunk'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'residential'
  | 'service';

export type IssueSeverity = 'Critical' | 'Major' | 'Minor' | 'Advisory';

export type IssueCategory =
  | 'Geometry'
  | 'Connectivity'
  | 'Lane Attributes'
  | 'Traffic Control'
  | 'Classification'
  | 'Visual Aerial Discrepancy';

export type ReviewStatus = 'Open' | 'Under Review' | 'Resolved' | 'False Positive';

export interface Coordinate {
  lng: number;
  lat: number;
  elevation?: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  roadClass: RoadClass;
  coordinates: [number, number][]; // [lng, lat]
  lengthMeters: number;
  lanes: number;
  speedLimitKph: number;
  isOneWay: boolean;
  surface: 'asphalt' | 'concrete' | 'paved' | 'gravel';
  hasSidewalk: boolean;
  hasBicycleLane: boolean;
  trafficControl: 'signals' | 'stop_sign' | 'yield' | 'none' | 'uncontrolled';
  hasLaneMarkings: boolean;
  startNodeId: string;
  endNodeId: string;
  forwardDirection?: boolean;
  avSimReady: boolean;
  metadata?: Record<string, unknown>;
}

export interface IntersectionNode {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  connectedSegmentIds: string[];
  degree: number;
  type: 'standard_intersection' | 'roundabout' | 'cul_de_sac' | 'isolated_stub' | 'dead_end';
  trafficControl: 'signals' | 'stop_sign' | 'yield' | 'roundabout' | 'uncontrolled' | 'none';
  suspicious?: boolean;
  suspiciousReason?: string;
}

export interface ValidationIssue {
  id: string;
  segmentId?: string;
  nodeId?: string;
  ruleCode: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  suggestedAction: string;
  coordinates: [number, number]; // [lng, lat]
  status: ReviewStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isDemonstrationData?: boolean;
  requiresHumanVerification: boolean;
}

export interface AuditLogEntry {
  id: string;
  issueId: string;
  timestamp: string;
  actor: string;
  action: string;
  previousStatus: ReviewStatus;
  newStatus: ReviewStatus;
  notes: string;
}

export interface ValidationRuleDefinition {
  code: string;
  name: string;
  category: IssueCategory;
  severity: IssueSeverity;
  description: string;
  toleranceDefault: number;
  toleranceUnit: string;
  toleranceMin: number;
  toleranceMax: number;
  avSimImpact: string;
}

export interface TestResult {
  ruleCode: string;
  ruleName: string;
  category: string;
  testCaseName: string;
  passed: boolean;
  expectedOutcome: string;
  actualOutcome: string;
  executionMs: number;
}
