import { RoadSegment, IntersectionNode, ValidationIssue } from '../types/gis';

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  name: string;
  crs: {
    type: 'name';
    properties: {
      name: 'urn:ogc:def:crs:OGC:1.3:CRS84';
    };
  };
  features: Array<{
    type: 'Feature';
    id: string;
    properties: Record<string, unknown>;
    geometry: {
      type: 'LineString' | 'Point';
      coordinates: [number, number] | [number, number][];
    };
  }>;
}

/**
 * Creates QGIS-compatible GeoJSON of Road Network Centerlines
 */
export function exportRoadCenterlinesGeoJSON(segments: RoadSegment[]): GeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',
    name: 'RoadMap_QA_Road_Centerlines',
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
      }
    },
    features: segments.map(seg => ({
      type: 'Feature',
      id: seg.id,
      properties: {
        segment_id: seg.id,
        name: seg.name,
        road_class: seg.roadClass,
        length_m: seg.lengthMeters,
        lanes: seg.lanes,
        speed_kph: seg.speedLimitKph,
        one_way: seg.isOneWay ? 1 : 0,
        surface: seg.surface,
        has_sidewalk: seg.hasSidewalk ? 1 : 0,
        has_bikelane: seg.hasBicycleLane ? 1 : 0,
        traffic_ctrl: seg.trafficControl,
        has_markings: seg.hasLaneMarkings ? 1 : 0,
        start_node: seg.startNodeId,
        end_node: seg.endNodeId,
        sim_ready: seg.avSimReady ? 1 : 0
      },
      geometry: {
        type: 'LineString',
        coordinates: seg.coordinates
      }
    }))
  };
}

/**
 * Creates QGIS-compatible GeoJSON of Flagged Quality Issues
 */
export function exportIssuesGeoJSON(issues: ValidationIssue[]): GeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',
    name: 'RoadMap_QA_Quality_Issues',
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
      }
    },
    features: issues.map(issue => ({
      type: 'Feature',
      id: issue.id,
      properties: {
        issue_id: issue.id,
        rule_code: issue.ruleCode,
        category: issue.category,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        suggested_action: issue.suggestedAction,
        status: issue.status,
        feature_id: issue.segmentId || issue.nodeId || '',
        requires_human_eval: issue.requiresHumanVerification ? 1 : 0
      },
      geometry: {
        type: 'Point',
        coordinates: issue.coordinates
      }
    }))
  };
}

/**
 * Creates QGIS-compatible GeoJSON of Intersection Nodes
 */
export function exportIntersectionsGeoJSON(nodes: IntersectionNode[]): GeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',
    name: 'RoadMap_QA_Intersections',
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
      }
    },
    features: nodes.map(node => ({
      type: 'Feature',
      id: node.id,
      properties: {
        node_id: node.id,
        degree: node.degree,
        type: node.type,
        traffic_control: node.trafficControl,
        suspicious: node.suspicious ? 1 : 0,
        suspicious_reason: node.suspiciousReason || '',
        connected_count: node.connectedSegmentIds.length
      },
      geometry: {
        type: 'Point',
        coordinates: node.coordinates
      }
    }))
  };
}

/**
 * Generates CSV representation of segments
 */
export function exportSegmentsCSV(segments: RoadSegment[]): string {
  const headers = [
    'segment_id',
    'name',
    'road_class',
    'length_meters',
    'lanes',
    'speed_limit_kph',
    'is_one_way',
    'surface',
    'traffic_control',
    'has_markings',
    'start_node',
    'end_node',
    'sim_ready',
    'geometry_wkt'
  ];

  const rows = segments.map(s => {
    const coordsStr = s.coordinates.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
    const wkt = `"LINESTRING (${coordsStr})"`;
    return [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.roadClass,
      s.lengthMeters,
      s.lanes,
      s.speedLimitKph,
      s.isOneWay,
      s.surface,
      s.trafficControl,
      s.hasLaneMarkings,
      s.startNodeId,
      s.endNodeId,
      s.avSimReady,
      wkt
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Browser file download helper
 */
export function triggerFileDownload(content: string | Uint8Array, fileName: string, mimeType: string): void {
  const blob = content instanceof Uint8Array
    ? new Blob([content as any], { type: mimeType })
    : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
