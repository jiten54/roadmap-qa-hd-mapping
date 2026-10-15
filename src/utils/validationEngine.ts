import {
  RoadSegment,
  IntersectionNode,
  ValidationIssue,
  ValidationRuleDefinition
} from '../types/gis';
import {
  calculateDistanceMeters,
  calculateBearing,
  calculateApproachAngle,
  computePolylineMidpoint
} from './geoMath';

export interface ValidationConfig {
  snappingToleranceMeters: number;
  minSegmentLengthMeters: number;
  acuteAngleThresholdDegrees: number;
  maxDegreeWarningThreshold: number;
}

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  snappingToleranceMeters: 2.5,
  minSegmentLengthMeters: 3.0,
  acuteAngleThresholdDegrees: 20.0,
  maxDegreeWarningThreshold: 5
};

export const RULE_CATALOG: ValidationRuleDefinition[] = [
  {
    code: 'G01',
    name: 'Micro-Segment or Zero-Length Geometry',
    category: 'Geometry',
    severity: 'Critical',
    description: 'Road segment length is less than the minimum simulation threshold (<3.0m). Causes numerical instability in vehicle trajectory planners.',
    toleranceDefault: 3.0,
    toleranceUnit: 'meters',
    toleranceMin: 0.5,
    toleranceMax: 10.0,
    avSimImpact: 'Severe. Causes physics solver step errors and vehicle collision bounding box collapse.'
  },
  {
    code: 'G02',
    name: 'Self-Intersecting Polyline Geometry',
    category: 'Geometry',
    severity: 'Critical',
    description: 'Polyline geometry intersects itself forming a loop or figure-8 without a recognized node.',
    toleranceDefault: 0,
    toleranceUnit: 'degrees',
    toleranceMin: 0,
    toleranceMax: 0,
    avSimImpact: 'Severe. Fails polygon tessellation and OpenDRIVE lane-boundary export.'
  },
  {
    code: 'G03',
    name: 'Duplicate Road Segment Geometry',
    category: 'Geometry',
    severity: 'Critical',
    description: 'Two segments share identical or inverted spatial trajectories within tolerance. Causes double-counting and routing loops.',
    toleranceDefault: 0.5,
    toleranceUnit: 'meters',
    toleranceMin: 0.1,
    toleranceMax: 2.0,
    avSimImpact: 'Severe. Causes vehicle agent routing ambiguity and phantom obstacle reflections.'
  },
  {
    code: 'G04',
    name: 'Dangling Endpoint / Snapping Gap',
    category: 'Geometry',
    severity: 'Critical',
    description: 'Road endpoint terminates within snapping tolerance of another intersection node or segment without a topological connection.',
    toleranceDefault: 2.5,
    toleranceUnit: 'meters',
    toleranceMin: 0.5,
    toleranceMax: 10.0,
    avSimImpact: 'High. AV motion planners cannot transition between disconnected road boundaries.'
  },
  {
    code: 'G05',
    name: 'Acute Intersection Approach Angle',
    category: 'Geometry',
    severity: 'Major',
    description: 'Two road approaches meet at an angle sharper than tolerance (<20°), creating unrealistic turn radii.',
    toleranceDefault: 20.0,
    toleranceUnit: 'degrees',
    toleranceMin: 10.0,
    toleranceMax: 45.0,
    avSimImpact: 'Moderate. Autonomous steering controllers cannot negotiate sub-20° turn maneuvers.'
  },
  {
    code: 'C01',
    name: 'Dead-End / Dangling Stub',
    category: 'Connectivity',
    severity: 'Advisory',
    description: 'Road terminates at a degree-1 node. Requires human verification to verify if authentic cul-de-sac or map boundary artifact.',
    toleranceDefault: 1,
    toleranceUnit: 'degree',
    toleranceMin: 1,
    toleranceMax: 1,
    avSimImpact: 'Advisory. AV vehicle must support 3-point turnaround maneuvers if intended.'
  },
  {
    code: 'C02',
    name: 'Disconnected Component Island',
    category: 'Connectivity',
    severity: 'Critical',
    description: 'Road segment group is completely isolated with no path leading to the larger simulation network.',
    toleranceDefault: 1,
    toleranceUnit: 'subgraph',
    toleranceMin: 1,
    toleranceMax: 1,
    avSimImpact: 'Severe. Vehicles spawned in this subnetwork cannot navigate to external destination waypoints.'
  },
  {
    code: 'L01',
    name: 'Missing or Non-Positive Speed Limit',
    category: 'Lane Attributes',
    severity: 'Critical',
    description: 'Road segment has missing or 0 km/h speed limit. Behavioral agents cannot determine lawful target cruising velocity.',
    toleranceDefault: 5,
    toleranceUnit: 'km/h',
    toleranceMin: 5,
    toleranceMax: 130,
    avSimImpact: 'Severe. Sim agents stall or default to emergency braking.'
  },
  {
    code: 'L02',
    name: 'Unrealistic Lane Count Anomaly',
    category: 'Lane Attributes',
    severity: 'Major',
    description: 'Lane count is incongruent with road classification (e.g. residential street with >4 lanes or motorway with 1 lane).',
    toleranceDefault: 4,
    toleranceUnit: 'lanes',
    toleranceMin: 1,
    toleranceMax: 8,
    avSimImpact: 'High. Synthetic traffic spawning algorithms generate unrealistic congestion patterns.'
  },
  {
    code: 'L04',
    name: 'One-Way Vehicle Sink Trap',
    category: 'Traffic Control',
    severity: 'Critical',
    description: 'A one-way street terminates into a dead-end with no valid outgoing egress edges, creating a simulation trap.',
    toleranceDefault: 0,
    toleranceUnit: 'edges',
    toleranceMin: 0,
    toleranceMax: 0,
    avSimImpact: 'Severe. Autonomous vehicles enter the dead-end and cannot exit legally.'
  },
  {
    code: 'L06',
    name: 'Missing Road Markings on High-Speed Road',
    category: 'Traffic Control',
    severity: 'Major',
    description: 'Multi-lane or high-speed (>50 km/h) roadway lacks lane markings required for perception sensor models.',
    toleranceDefault: 50,
    toleranceUnit: 'km/h',
    toleranceMin: 30,
    toleranceMax: 120,
    avSimImpact: 'High. Camera perception simulation models fail lane boundary detection.'
  }
];

/**
 * Executes full quality validation against road segments and intersection nodes
 */
export function runValidationSuite(
  segments: RoadSegment[],
  nodes: IntersectionNode[],
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let issueCounter = 1;

  const nextId = (prefix: string) => `ISSUE-${prefix}-${String(issueCounter++).padStart(3, '0')}`;

  // 1. GEOMETRY VALIDATION: Segment by Segment
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    // G01: Micro-segment / Zero-Length Check
    if (seg.lengthMeters < config.minSegmentLengthMeters) {
      issues.push({
        id: nextId('GEO'),
        segmentId: seg.id,
        ruleCode: 'G01',
        category: 'Geometry',
        severity: 'Critical',
        title: `Micro-Segment (${seg.lengthMeters.toFixed(1)}m < ${config.minSegmentLengthMeters}m)`,
        description: `Segment '${seg.name}' (${seg.id}) has a total length of ${seg.lengthMeters.toFixed(2)}m, which is below the simulation threshold of ${config.minSegmentLengthMeters}m.`,
        suggestedAction: 'Merge micro-segment into adjacent edge or delete if topological artifact.',
        coordinates: computePolylineMidpoint(seg.coordinates),
        status: 'Open',
        requiresHumanVerification: false
      });
    }

    // G03: Duplicate geometry check
    for (let j = i + 1; j < segments.length; j++) {
      const other = segments[j];
      const startDist = calculateDistanceMeters(seg.coordinates[0], other.coordinates[0]);
      const endDist = calculateDistanceMeters(
        seg.coordinates[seg.coordinates.length - 1],
        other.coordinates[other.coordinates.length - 1]
      );
      const startEndDist = calculateDistanceMeters(
        seg.coordinates[0],
        other.coordinates[other.coordinates.length - 1]
      );
      const endStartDist = calculateDistanceMeters(
        seg.coordinates[seg.coordinates.length - 1],
        other.coordinates[0]
      );

      const isDuplicateForward = startDist < 1.0 && endDist < 1.0;
      const isDuplicateReverse = startEndDist < 1.0 && endStartDist < 1.0;

      if (isDuplicateForward || isDuplicateReverse) {
        issues.push({
          id: nextId('GEO'),
          segmentId: seg.id,
          ruleCode: 'G03',
          category: 'Geometry',
          severity: 'Critical',
          title: `Duplicate Segment Geometry with ${other.id}`,
          description: `Segment '${seg.name}' (${seg.id}) shares identical geometry trajectory with '${other.name}' (${other.id}).`,
          suggestedAction: 'Remove duplicate record or consolidate into a single bidirectional or divided edge.',
          coordinates: computePolylineMidpoint(seg.coordinates),
          status: 'Open',
          requiresHumanVerification: false
        });
      }
    }

    // G04: Dangling endpoint snapping gap check
    // Look at start and end coordinates of segment. If distance to any node is > 0.1m and <= snappingToleranceMeters
    const startCoord = seg.coordinates[0];
    const endCoord = seg.coordinates[seg.coordinates.length - 1];

    for (const node of nodes) {
      const distToStart = calculateDistanceMeters(startCoord, node.coordinates);
      const distToEnd = calculateDistanceMeters(endCoord, node.coordinates);

      if (distToStart > 0.15 && distToStart <= config.snappingToleranceMeters) {
        issues.push({
          id: nextId('GEO'),
          segmentId: seg.id,
          nodeId: node.id,
          ruleCode: 'G04',
          category: 'Geometry',
          severity: 'Critical',
          title: `Snapping Gap (${distToStart.toFixed(1)}m from ${node.id})`,
          description: `Segment '${seg.name}' start point is ${distToStart.toFixed(2)}m from Node ${node.id}, within snapping tolerance of ${config.snappingToleranceMeters}m but not connected.`,
          suggestedAction: `Snap endpoint to Node ${node.id} coordinates [${node.coordinates[0].toFixed(5)}, ${node.coordinates[1].toFixed(5)}].`,
          coordinates: startCoord,
          status: 'Open',
          requiresHumanVerification: true
        });
      }

      if (distToEnd > 0.15 && distToEnd <= config.snappingToleranceMeters) {
        issues.push({
          id: nextId('GEO'),
          segmentId: seg.id,
          nodeId: node.id,
          ruleCode: 'G04',
          category: 'Geometry',
          severity: 'Critical',
          title: `Snapping Gap (${distToEnd.toFixed(1)}m from ${node.id})`,
          description: `Segment '${seg.name}' end point is ${distToEnd.toFixed(2)}m from Node ${node.id}, within snapping tolerance of ${config.snappingToleranceMeters}m but not connected.`,
          suggestedAction: `Snap endpoint to Node ${node.id} coordinates [${node.coordinates[0].toFixed(5)}, ${node.coordinates[1].toFixed(5)}].`,
          coordinates: endCoord,
          status: 'Open',
          requiresHumanVerification: true
        });
      }
    }

    // L01: Speed limit missing or invalid
    if (!seg.speedLimitKph || seg.speedLimitKph <= 0) {
      issues.push({
        id: nextId('ATT'),
        segmentId: seg.id,
        ruleCode: 'L01',
        category: 'Lane Attributes',
        severity: 'Critical',
        title: `Missing Speed Limit Attribute (${seg.roadClass})`,
        description: `Segment '${seg.name}' (${seg.id}) is classified as '${seg.roadClass}' but has no speed limit defined (current: ${seg.speedLimitKph || 0} km/h).`,
        suggestedAction: `Assign jurisdiction default speed limit based on road class (recommended: ${getDefaultSpeedForClass(seg.roadClass)} km/h).`,
        coordinates: computePolylineMidpoint(seg.coordinates),
        status: 'Open',
        requiresHumanVerification: false
      });
    }

    // L02: Unrealistic lane count
    if (seg.roadClass === 'residential' && seg.lanes > 4) {
      issues.push({
        id: nextId('ATT'),
        segmentId: seg.id,
        ruleCode: 'L02',
        category: 'Lane Attributes',
        severity: 'Major',
        title: `Excessive Lane Count for Residential Street (${seg.lanes} lanes)`,
        description: `Residential segment '${seg.name}' has ${seg.lanes} lanes, which exceeds typical residential design limits.`,
        suggestedAction: 'Verify against satellite imagery; adjust lane count to actual curb-to-curb capacity (typically 1-2 lanes).',
        coordinates: computePolylineMidpoint(seg.coordinates),
        status: 'Open',
        requiresHumanVerification: true
      });
    } else if (seg.roadClass === 'motorway' && seg.lanes < 2) {
      issues.push({
        id: nextId('ATT'),
        segmentId: seg.id,
        ruleCode: 'L02',
        category: 'Lane Attributes',
        severity: 'Major',
        title: `Motorway Has Only 1 Lane`,
        description: `Motorway segment '${seg.name}' is coded with 1 lane. Motorways in AV simulation typically require >= 2 lanes or ramp classification.`,
        suggestedAction: 'Check if this segment should be reclassified as a trunk ramp or if lanes are missing.',
        coordinates: computePolylineMidpoint(seg.coordinates),
        status: 'Open',
        requiresHumanVerification: true
      });
    }

    // L06: Missing road markings on high speed road
    if (seg.lanes >= 2 && seg.speedLimitKph >= 60 && !seg.hasLaneMarkings) {
      issues.push({
        id: nextId('ATT'),
        segmentId: seg.id,
        ruleCode: 'L06',
        category: 'Traffic Control',
        severity: 'Major',
        title: `High-Speed Multilane Road Missing Lane Markings`,
        description: `Segment '${seg.name}' is ${seg.lanes} lanes with ${seg.speedLimitKph} km/h speed limit but flagged with no lane markings.`,
        suggestedAction: 'Confirm lane marking presence from aerial/dashcam imagery and update road model.',
        coordinates: computePolylineMidpoint(seg.coordinates),
        status: 'Open',
        requiresHumanVerification: true
      });
    }
  }

  // 2. INTERSECTION & ANGLE VALIDATION
  for (const node of nodes) {
    const connectedSegs = segments.filter(s =>
      s.startNodeId === node.id || s.endNodeId === node.id ||
      calculateDistanceMeters(s.coordinates[0], node.coordinates) < 0.1 ||
      calculateDistanceMeters(s.coordinates[s.coordinates.length - 1], node.coordinates) < 0.1
    );

    // G05: Acute approach angles
    if (connectedSegs.length >= 2) {
      for (let m = 0; m < connectedSegs.length; m++) {
        for (let n = m + 1; n < connectedSegs.length; n++) {
          const segA = connectedSegs[m];
          const segB = connectedSegs[n];

          // Determine far coords for bearing
          const farCoordA = calculateDistanceMeters(segA.coordinates[0], node.coordinates) < 0.1
            ? segA.coordinates[segA.coordinates.length - 1]
            : segA.coordinates[0];

          const farCoordB = calculateDistanceMeters(segB.coordinates[0], node.coordinates) < 0.1
            ? segB.coordinates[segB.coordinates.length - 1]
            : segB.coordinates[0];

          const angle = calculateApproachAngle(node.coordinates, farCoordA, farCoordB);

          if (angle < config.acuteAngleThresholdDegrees && angle > 1.0) {
            issues.push({
              id: nextId('INT'),
              nodeId: node.id,
              segmentId: segA.id,
              ruleCode: 'G05',
              category: 'Geometry',
              severity: 'Major',
              title: `Acute Intersection Angle (${angle.toFixed(1)}° < ${config.acuteAngleThresholdDegrees}°)`,
              description: `Sharp junction convergence between '${segA.name}' and '${segB.name}' at Node ${node.id} (${angle.toFixed(1)}°).`,
              suggestedAction: 'Verify physical geometry on aerial imagery. Taper slipway or re-align approach centerline.',
              coordinates: node.coordinates,
              status: 'Open',
              requiresHumanVerification: true
            });
          }
        }
      }
    }

    // L04: One-way vehicle sink check
    // If all connected segments are one-way entering the node, and no outgoing segments exist
    if (connectedSegs.length === 1 && connectedSegs[0].isOneWay) {
      const seg = connectedSegs[0];
      const isEntering = calculateDistanceMeters(seg.coordinates[seg.coordinates.length - 1], node.coordinates) < 0.1;
      if (isEntering) {
        issues.push({
          id: nextId('TRF'),
          nodeId: node.id,
          segmentId: seg.id,
          ruleCode: 'L04',
          category: 'Traffic Control',
          severity: 'Critical',
          title: `One-Way Vehicle Sink Trap at Dead-End`,
          description: `One-way segment '${seg.name}' terminates at Node ${node.id} with no egress edge. Autonomous vehicles routed here cannot exit.`,
          suggestedAction: 'Convert segment to two-way, reverse travel direction, or connect egress loop.',
          coordinates: node.coordinates,
          status: 'Open',
          requiresHumanVerification: false
        });
      }
    }

    // C01: Degree 1 dead-end verification
    if (connectedSegs.length === 1 && !node.suspicious && node.type !== 'cul_de_sac') {
      issues.push({
        id: nextId('CON'),
        nodeId: node.id,
        segmentId: connectedSegs[0].id,
        ruleCode: 'C01',
        category: 'Connectivity',
        severity: 'Advisory',
        title: `Dead-End / Boundary Stub (Node Degree 1)`,
        description: `Node ${node.id} connects only 1 segment ('${connectedSegs[0].name}'). Verify if boundary cutoff or true turnaround cul-de-sac.`,
        suggestedAction: 'Label as verified cul-de-sac with turnaround bulb or extend network to tile boundary.',
        coordinates: node.coordinates,
        status: 'Open',
        requiresHumanVerification: true
      });
    }
  }

  // 3. GRAPH CONNECTIVITY: Connected Components Analysis
  const componentIssues = checkGraphConnectedComponents(segments, nodes, nextId);
  issues.push(...componentIssues);

  return issues;
}

/**
 * Traverses segment endpoints to identify isolated disconnected subgraphs
 */
function checkGraphConnectedComponents(
  segments: RoadSegment[],
  nodes: IntersectionNode[],
  nextId: (prefix: string) => string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (segments.length === 0) return issues;

  // Build adjacency list between segments that share endpoints (distance < 0.2m)
  const adj = new Map<string, string[]>();
  for (const s of segments) {
    adj.set(s.id, []);
  }

  for (let i = 0; i < segments.length; i++) {
    const s1 = segments[i];
    const s1Start = s1.coordinates[0];
    const s1End = s1.coordinates[s1.coordinates.length - 1];

    for (let j = i + 1; j < segments.length; j++) {
      const s2 = segments[j];
      const s2Start = s2.coordinates[0];
      const s2End = s2.coordinates[s2.coordinates.length - 1];

      const connects =
        calculateDistanceMeters(s1Start, s2Start) < 0.5 ||
        calculateDistanceMeters(s1Start, s2End) < 0.5 ||
        calculateDistanceMeters(s1End, s2Start) < 0.5 ||
        calculateDistanceMeters(s1End, s2End) < 0.5;

      if (connects) {
        adj.get(s1.id)?.push(s2.id);
        adj.get(s2.id)?.push(s1.id);
      }
    }
  }

  // Find connected components via BFS
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const seg of segments) {
    if (!visited.has(seg.id)) {
      const comp: string[] = [];
      const queue = [seg.id];
      visited.add(seg.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);
        const neighbors = adj.get(curr) || [];
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        }
      }
      components.push(comp);
    }
  }

  // If there is more than 1 component, the largest is the main network; smaller ones are isolated islands
  if (components.length > 1) {
    components.sort((a, b) => b.length - a.length);
    const mainComponent = components[0];

    for (let c = 1; c < components.length; c++) {
      const island = components[c];
      for (const segId of island) {
        const seg = segments.find(s => s.id === segId);
        if (seg) {
          issues.push({
            id: nextId('CON'),
            segmentId: seg.id,
            ruleCode: 'C02',
            category: 'Connectivity',
            severity: 'Critical',
            title: `Isolated Subnetwork Island (${island.length} segment${island.length > 1 ? 's' : ''})`,
            description: `Segment '${seg.name}' belongs to an isolated subnetwork of ${island.length} segment(s) with zero topological path to the main network (${mainComponent.length} segments).`,
            suggestedAction: 'Connect island to main simulation network or remove if outside operational design domain (ODD).',
            coordinates: computePolylineMidpoint(seg.coordinates),
            status: 'Open',
            requiresHumanVerification: true
          });
        }
      }
    }
  }

  return issues;
}

function getDefaultSpeedForClass(roadClass: string): number {
  switch (roadClass) {
    case 'motorway': return 100;
    case 'trunk': return 80;
    case 'primary': return 50;
    case 'secondary': return 40;
    case 'tertiary': return 35;
    case 'residential': return 25;
    case 'service': return 20;
    default: return 30;
  }
}
