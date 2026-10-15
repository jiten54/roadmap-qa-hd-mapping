import { RoadSegment, IntersectionNode } from '../types/gis';
import { calculatePolylineLength } from '../utils/geoMath';

export interface DatasetBundle {
  id: string;
  name: string;
  description: string;
  locationName: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  segments: RoadSegment[];
  nodes: IntersectionNode[];
}

// Coordinate origin: San Francisco SoMa AV Testing Grid (~37.788, -122.398)
const SF_CENTER: [number, number] = [37.7885, -122.3975];

export const SF_AV_TEST_DATASET: DatasetBundle = {
  id: 'sf_av_urban',
  name: 'San Francisco AV Testing Grid (Benchmark)',
  description: 'Urban autonomous vehicle testing corridor with intentionally seeded topological, geometric, and attribute anomalies.',
  locationName: 'San Francisco, CA (SoMa / Embarcadero Proving Zone)',
  center: SF_CENTER,
  zoom: 16,
  nodes: [
    { id: 'NODE_01', coordinates: [-122.4020, 37.7890], connectedSegmentIds: ['SEG_01', 'SEG_04'], degree: 2, type: 'standard_intersection', trafficControl: 'signals' },
    { id: 'NODE_02', coordinates: [-122.3990, 37.7890], connectedSegmentIds: ['SEG_01', 'SEG_02', 'SEG_05'], degree: 3, type: 'standard_intersection', trafficControl: 'signals' },
    { id: 'NODE_03', coordinates: [-122.3960, 37.7890], connectedSegmentIds: ['SEG_02', 'SEG_03', 'SEG_06'], degree: 3, type: 'standard_intersection', trafficControl: 'signals' },
    { id: 'NODE_04', coordinates: [-122.3930, 37.7890], connectedSegmentIds: ['SEG_03', 'SEG_07'], degree: 2, type: 'standard_intersection', trafficControl: 'stop_sign' },
    { id: 'NODE_05', coordinates: [-122.4020, 37.7865], connectedSegmentIds: ['SEG_04', 'SEG_08', 'SEG_11'], degree: 3, type: 'standard_intersection', trafficControl: 'signals' },
    { id: 'NODE_06', coordinates: [-122.3990, 37.7865], connectedSegmentIds: ['SEG_05', 'SEG_08', 'SEG_09', 'SEG_12'], degree: 4, type: 'standard_intersection', trafficControl: 'signals' },
    { id: 'NODE_07', coordinates: [-122.3960, 37.7865], connectedSegmentIds: ['SEG_06', 'SEG_09', 'SEG_10', 'SEG_13'], degree: 4, type: 'standard_intersection', trafficControl: 'signals' },
    { id: 'NODE_08', coordinates: [-122.3930, 37.7865], connectedSegmentIds: ['SEG_07', 'SEG_10', 'SEG_14'], degree: 3, type: 'standard_intersection', trafficControl: 'stop_sign' },
    { id: 'NODE_09', coordinates: [-122.4020, 37.7840], connectedSegmentIds: ['SEG_11', 'SEG_15'], degree: 2, type: 'standard_intersection', trafficControl: 'uncontrolled' },
    { id: 'NODE_10', coordinates: [-122.3990, 37.7840], connectedSegmentIds: ['SEG_12', 'SEG_15', 'SEG_16'], degree: 3, type: 'standard_intersection', trafficControl: 'stop_sign' },
    { id: 'NODE_11', coordinates: [-122.3960, 37.7840], connectedSegmentIds: ['SEG_13', 'SEG_16', 'SEG_17'], degree: 3, type: 'standard_intersection', trafficControl: 'stop_sign' },
    { id: 'NODE_12', coordinates: [-122.3930, 37.7840], connectedSegmentIds: ['SEG_14', 'SEG_17'], degree: 2, type: 'standard_intersection', trafficControl: 'uncontrolled' },
    // Intentional anomaly nodes
    { id: 'NODE_ACUTE', coordinates: [-122.3960, 37.7865], connectedSegmentIds: ['SEG_09', 'SEG_RAMP_ACUTE'], degree: 2, type: 'standard_intersection', trafficControl: 'yield', suspicious: true, suspiciousReason: 'Acute junction angle (14.2°)' },
    { id: 'NODE_GAP_1', coordinates: [-122.3975, 37.7852], connectedSegmentIds: ['SEG_CULDESAC_GAP'], degree: 1, type: 'isolated_stub', trafficControl: 'uncontrolled', suspicious: true, suspiciousReason: 'Endpoint 2.1m from SEG_16 without topology snap' },
    { id: 'NODE_SINK', coordinates: [-122.4005, 37.7850], connectedSegmentIds: ['SEG_SINK_ONEWAY'], degree: 1, type: 'dead_end', trafficControl: 'none', suspicious: true, suspiciousReason: 'One-way street entering dead end (AV vehicle sink)' },
    { id: 'NODE_ISLAND_A', coordinates: [-122.4040, 37.7875], connectedSegmentIds: ['SEG_ISLAND_01'], degree: 1, type: 'isolated_stub', trafficControl: 'none', suspicious: true, suspiciousReason: 'Disconnected component island' },
    { id: 'NODE_ISLAND_B', coordinates: [-122.4040, 37.7855], connectedSegmentIds: ['SEG_ISLAND_01'], degree: 1, type: 'isolated_stub', trafficControl: 'none', suspicious: true, suspiciousReason: 'Disconnected component island' }
  ],
  segments: [
    // East-West Arterial 1 (Market / Folsom Corridor)
    {
      id: 'SEG_01',
      name: 'Folsom St (West)',
      roadClass: 'primary',
      coordinates: [[-122.4020, 37.7890], [-122.3990, 37.7890]],
      lengthMeters: 264,
      lanes: 3,
      speedLimitKph: 45,
      isOneWay: true,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_01',
      endNodeId: 'NODE_02',
      avSimReady: true
    },
    {
      id: 'SEG_02',
      name: 'Folsom St (Central)',
      roadClass: 'primary',
      coordinates: [[-122.3990, 37.7890], [-122.3960, 37.7890]],
      lengthMeters: 264,
      lanes: 3,
      speedLimitKph: 45,
      isOneWay: true,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_02',
      endNodeId: 'NODE_03',
      avSimReady: true
    },
    {
      id: 'SEG_03',
      name: 'Folsom St (East)',
      roadClass: 'primary',
      coordinates: [[-122.3960, 37.7890], [-122.3930, 37.7890]],
      lengthMeters: 264,
      lanes: 3,
      speedLimitKph: 45,
      isOneWay: true,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_03',
      endNodeId: 'NODE_04',
      avSimReady: true
    },
    // North-South Avenues
    {
      id: 'SEG_04',
      name: '3rd Street (Upper)',
      roadClass: 'secondary',
      coordinates: [[-122.4020, 37.7890], [-122.4020, 37.7865]],
      lengthMeters: 278,
      lanes: 2,
      speedLimitKph: 40,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: false,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_01',
      endNodeId: 'NODE_05',
      avSimReady: true
    },
    {
      id: 'SEG_05',
      name: 'Hawthorne St (Upper)',
      roadClass: 'secondary',
      coordinates: [[-122.3990, 37.7890], [-122.3990, 37.7865]],
      lengthMeters: 278,
      lanes: 2,
      speedLimitKph: 40,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: false,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_02',
      endNodeId: 'NODE_06',
      avSimReady: true
    },
    {
      id: 'SEG_06',
      name: '2nd Street (Upper)',
      roadClass: 'secondary',
      coordinates: [[-122.3960, 37.7890], [-122.3960, 37.7865]],
      lengthMeters: 278,
      lanes: 2,
      speedLimitKph: 40,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_03',
      endNodeId: 'NODE_07',
      avSimReady: true
    },
    {
      id: 'SEG_07',
      name: 'New Montgomery St (Upper)',
      roadClass: 'residential',
      coordinates: [[-122.3930, 37.7890], [-122.3930, 37.7865]],
      lengthMeters: 278,
      lanes: 2,
      speedLimitKph: 35,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: false,
      trafficControl: 'stop_sign',
      hasLaneMarkings: true,
      startNodeId: 'NODE_04',
      endNodeId: 'NODE_08',
      avSimReady: true
    },
    // Middle East-West Row (Howard St)
    {
      id: 'SEG_08',
      name: 'Howard St (West)',
      roadClass: 'primary',
      coordinates: [[-122.4020, 37.7865], [-122.3990, 37.7865]],
      lengthMeters: 264,
      lanes: 3,
      speedLimitKph: 45,
      isOneWay: true,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_05',
      endNodeId: 'NODE_06',
      avSimReady: true
    },
    {
      id: 'SEG_09',
      name: 'Howard St (Central)',
      roadClass: 'primary',
      coordinates: [[-122.3990, 37.7865], [-122.3960, 37.7865]],
      lengthMeters: 264,
      lanes: 3,
      speedLimitKph: 45,
      isOneWay: true,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_06',
      endNodeId: 'NODE_07',
      avSimReady: true
    },
    {
      id: 'SEG_10',
      name: 'Howard St (East)',
      roadClass: 'primary',
      coordinates: [[-122.3960, 37.7865], [-122.3930, 37.7865]],
      lengthMeters: 264,
      lanes: 3,
      speedLimitKph: 45,
      isOneWay: true,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_07',
      endNodeId: 'NODE_08',
      avSimReady: true
    },
    // Lower North-South
    {
      id: 'SEG_11',
      name: '3rd Street (Lower)',
      roadClass: 'secondary',
      coordinates: [[-122.4020, 37.7865], [-122.4020, 37.7840]],
      lengthMeters: 278,
      lanes: 2,
      speedLimitKph: 40,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: false,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_05',
      endNodeId: 'NODE_09',
      avSimReady: true
    },
    {
      id: 'SEG_12',
      name: 'Hawthorne St (Lower)',
      roadClass: 'secondary',
      coordinates: [[-122.3990, 37.7865], [-122.3990, 37.7840]],
      lengthMeters: 278,
      lanes: 2,
      speedLimitKph: 40,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: false,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_06',
      endNodeId: 'NODE_10',
      avSimReady: true
    },
    {
      id: 'SEG_13',
      name: '2nd Street (Lower)',
      roadClass: 'secondary',
      coordinates: [[-122.3960, 37.7865], [-122.3960, 37.7840]],
      lengthMeters: 278,
      lanes: 2,
      speedLimitKph: 40,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_07',
      endNodeId: 'NODE_11',
      avSimReady: true
    },
    {
      id: 'SEG_14',
      name: 'New Montgomery St (Lower)',
      roadClass: 'residential',
      coordinates: [[-122.3930, 37.7865], [-122.3930, 37.7840]],
      lengthMeters: 278,
      lanes: 2,
      speedLimitKph: 35,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: false,
      trafficControl: 'stop_sign',
      hasLaneMarkings: true,
      startNodeId: 'NODE_08',
      endNodeId: 'NODE_12',
      avSimReady: true
    },
    // Bottom East-West Row (Mission St Corridor)
    {
      id: 'SEG_15',
      name: 'Mission St (West)',
      roadClass: 'primary',
      coordinates: [[-122.4020, 37.7840], [-122.3990, 37.7840]],
      lengthMeters: 264,
      lanes: 3,
      speedLimitKph: 45,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_09',
      endNodeId: 'NODE_10',
      avSimReady: true
    },
    {
      id: 'SEG_16',
      name: 'Mission St (Central)',
      roadClass: 'primary',
      coordinates: [[-122.3990, 37.7840], [-122.3960, 37.7840]],
      lengthMeters: 264,
      lanes: 3,
      speedLimitKph: 45,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_10',
      endNodeId: 'NODE_11',
      avSimReady: true
    },
    {
      id: 'SEG_17',
      name: 'Mission St (East)',
      roadClass: 'primary',
      coordinates: [[-122.3960, 37.7840], [-122.3930, 37.7840]],
      lengthMeters: 264,
      lanes: 3,
      speedLimitKph: 45,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_11',
      endNodeId: 'NODE_12',
      avSimReady: true
    },

    // ------------------------------------------------------------------------
    // INTENTIONALLY INTRODUCED ANOMALIES (Known ground truth for validation engine)
    // ------------------------------------------------------------------------

    // ANOMALY 1: Zero-length or micro-segment (<3m) -> violates G01
    {
      id: 'SEG_MICRO_01',
      name: 'Alley Micro-Spur',
      roadClass: 'service',
      coordinates: [[-122.3970, 37.7870], [-122.397008, 37.787006]],
      lengthMeters: 0.95,
      lanes: 1,
      speedLimitKph: 15,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: false,
      hasBicycleLane: false,
      trafficControl: 'none',
      hasLaneMarkings: false,
      startNodeId: 'NODE_06',
      endNodeId: 'NODE_MICRO_END',
      avSimReady: false
    },

    // ANOMALY 2: Duplicate geometry (identical to SEG_08) -> violates G03
    {
      id: 'SEG_DUP_08',
      name: 'Howard St Duplicate Ghost Segment',
      roadClass: 'primary',
      coordinates: [[-122.4020, 37.7865], [-122.3990, 37.7865]],
      lengthMeters: 264,
      lanes: 3,
      speedLimitKph: 45,
      isOneWay: true,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: true,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'NODE_05',
      endNodeId: 'NODE_06',
      avSimReady: false
    },

    // ANOMALY 3: Dangling endpoint / near-miss gap (within 2.1m of SEG_16 but NOT snapped) -> violates G04 / C01
    {
      id: 'SEG_CULDESAC_GAP',
      name: 'Minna St Stub (Snapping Gap)',
      roadClass: 'residential',
      coordinates: [[-122.3975, 37.7852], [-122.3975, 37.78402]], // lat 37.78402 is 2.2 meters north of 37.7840
      lengthMeters: 131,
      lanes: 2,
      speedLimitKph: 30,
      isOneWay: false,
      surface: 'paved',
      hasSidewalk: true,
      hasBicycleLane: false,
      trafficControl: 'stop_sign',
      hasLaneMarkings: false,
      startNodeId: 'NODE_GAP_START',
      endNodeId: 'NODE_GAP_1',
      avSimReady: false
    },

    // ANOMALY 4: Acute junction angle (14.2° approach) -> violates G05
    {
      id: 'SEG_RAMP_ACUTE',
      name: 'Transit Slipway (Acute Intersection)',
      roadClass: 'service',
      coordinates: [[-122.3960, 37.7865], [-122.3985, 37.7868]],
      lengthMeters: 223,
      lanes: 1,
      speedLimitKph: 25,
      isOneWay: true,
      surface: 'asphalt',
      hasSidewalk: false,
      hasBicycleLane: false,
      trafficControl: 'yield',
      hasLaneMarkings: true,
      startNodeId: 'NODE_ACUTE',
      endNodeId: 'NODE_RAMP_END',
      avSimReady: false
    },

    // ANOMALY 5: Missing speed limit on arterial (speedLimitKph = 0) -> violates L01
    {
      id: 'SEG_MISSING_SPEED',
      name: 'Natoma Connector (Missing Speed Limit)',
      roadClass: 'primary',
      coordinates: [[-122.3960, 37.7875], [-122.3930, 37.7875]],
      lengthMeters: 264,
      lanes: 2,
      speedLimitKph: 0, // Missing speed attribute
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: false,
      trafficControl: 'uncontrolled',
      hasLaneMarkings: true,
      startNodeId: 'NODE_03',
      endNodeId: 'NODE_04',
      avSimReady: false
    },

    // ANOMALY 6: Lane count anomaly on residential street (lanes = 6) -> violates L02
    {
      id: 'SEG_LANE_OVERFLOW',
      name: 'Tehama Alley (Excessive Lane Count)',
      roadClass: 'residential',
      coordinates: [[-122.3990, 37.7855], [-122.3960, 37.7855]],
      lengthMeters: 264,
      lanes: 6, // Unrealistic 6 lanes on 4-meter narrow alley
      speedLimitKph: 25,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: false,
      hasBicycleLane: false,
      trafficControl: 'uncontrolled',
      hasLaneMarkings: true,
      startNodeId: 'NODE_06',
      endNodeId: 'NODE_07',
      avSimReady: false
    },

    // ANOMALY 7: One-way road entering dead end (Sink node trapping vehicles) -> violates L04
    {
      id: 'SEG_SINK_ONEWAY',
      name: 'Terminal Delivery Way (One-Way Sink)',
      roadClass: 'service',
      coordinates: [[-122.3990, 37.7850], [-122.4005, 37.7850]],
      lengthMeters: 132,
      lanes: 1,
      speedLimitKph: 20,
      isOneWay: true, // One-way forward pointing to dead end with no outlet
      surface: 'concrete',
      hasSidewalk: false,
      hasBicycleLane: false,
      trafficControl: 'none',
      hasLaneMarkings: false,
      startNodeId: 'NODE_10',
      endNodeId: 'NODE_SINK',
      avSimReady: false
    },

    // ANOMALY 8: Disconnected component island (not reachable from main road network) -> violates C02
    {
      id: 'SEG_ISLAND_01',
      name: 'Isolated Yard Test Loop',
      roadClass: 'service',
      coordinates: [[-122.4040, 37.7875], [-122.4040, 37.7855]],
      lengthMeters: 222,
      lanes: 1,
      speedLimitKph: 20,
      isOneWay: false,
      surface: 'concrete',
      hasSidewalk: false,
      hasBicycleLane: false,
      trafficControl: 'none',
      hasLaneMarkings: false,
      startNodeId: 'NODE_ISLAND_A',
      endNodeId: 'NODE_ISLAND_B',
      avSimReady: false
    }
  ]
};

// Detroit Proving Ground Track (High Speed & Merge Geometry)
const DETROIT_CENTER: [number, number] = [42.3314, -83.0458];

export const DETROIT_PROVING_GROUND_DATASET: DatasetBundle = {
  id: 'detroit_proving_ground',
  name: 'Detroit Proving Ground (Interchange & High-Speed)',
  description: 'Simulated proving grounds with divided highway, cloverleaf ramps, merge lanes, and deceleration zones.',
  locationName: 'Detroit Proving Ground, MI',
  center: DETROIT_CENTER,
  zoom: 15,
  nodes: [
    { id: 'DET_N01', coordinates: [-83.0520, 42.3314], connectedSegmentIds: ['DET_HWY_01'], degree: 1, type: 'standard_intersection', trafficControl: 'none' },
    { id: 'DET_N02', coordinates: [-83.0458, 42.3314], connectedSegmentIds: ['DET_HWY_01', 'DET_HWY_02', 'DET_RAMP_ON'], degree: 3, type: 'standard_intersection', trafficControl: 'none' },
    { id: 'DET_N03', coordinates: [-83.0390, 42.3314], connectedSegmentIds: ['DET_HWY_02', 'DET_RAMP_OFF'], degree: 2, type: 'standard_intersection', trafficControl: 'none' },
    { id: 'DET_N04', coordinates: [-83.0458, 42.3270], connectedSegmentIds: ['DET_LOCAL_01', 'DET_RAMP_ON'], degree: 2, type: 'standard_intersection', trafficControl: 'signals' },
    { id: 'DET_N05', coordinates: [-83.0390, 42.3270], connectedSegmentIds: ['DET_LOCAL_01', 'DET_RAMP_OFF'], degree: 2, type: 'standard_intersection', trafficControl: 'stop_sign' }
  ],
  segments: [
    {
      id: 'DET_HWY_01',
      name: 'Test Oval - West Straight',
      roadClass: 'motorway',
      coordinates: [[-83.0520, 42.3314], [-83.0458, 42.3314]],
      lengthMeters: 512,
      lanes: 4,
      speedLimitKph: 110,
      isOneWay: true,
      surface: 'concrete',
      hasSidewalk: false,
      hasBicycleLane: false,
      trafficControl: 'none',
      hasLaneMarkings: true,
      startNodeId: 'DET_N01',
      endNodeId: 'DET_N02',
      avSimReady: true
    },
    {
      id: 'DET_HWY_02',
      name: 'Test Oval - East Straight',
      roadClass: 'motorway',
      coordinates: [[-83.0458, 42.3314], [-83.0390, 42.3314]],
      lengthMeters: 560,
      lanes: 3, // Lane drop from 4 to 3
      speedLimitKph: 110,
      isOneWay: true,
      surface: 'concrete',
      hasSidewalk: false,
      hasBicycleLane: false,
      trafficControl: 'none',
      hasLaneMarkings: true,
      startNodeId: 'DET_N02',
      endNodeId: 'DET_N03',
      avSimReady: true
    },
    {
      id: 'DET_RAMP_ON',
      name: 'Interchange On-Ramp 4B',
      roadClass: 'trunk',
      coordinates: [[-83.0458, 42.3270], [-83.0480, 42.3292], [-83.0458, 42.3314]],
      lengthMeters: 550,
      lanes: 1,
      speedLimitKph: 60,
      isOneWay: true,
      surface: 'asphalt',
      hasSidewalk: false,
      hasBicycleLane: false,
      trafficControl: 'yield',
      hasLaneMarkings: true,
      startNodeId: 'DET_N04',
      endNodeId: 'DET_N02',
      avSimReady: true
    },
    {
      id: 'DET_RAMP_OFF',
      name: 'Interchange Off-Ramp 5A',
      roadClass: 'trunk',
      coordinates: [[-83.0390, 42.3314], [-83.0380, 42.3290], [-83.0390, 42.3270]],
      lengthMeters: 540,
      lanes: 1,
      speedLimitKph: 55,
      isOneWay: true,
      surface: 'asphalt',
      hasSidewalk: false,
      hasBicycleLane: false,
      trafficControl: 'none',
      hasLaneMarkings: true,
      startNodeId: 'DET_N03',
      endNodeId: 'DET_N05',
      avSimReady: true
    },
    {
      id: 'DET_LOCAL_01',
      name: 'Perimeter Feeder Road',
      roadClass: 'secondary',
      coordinates: [[-83.0458, 42.3270], [-83.0390, 42.3270]],
      lengthMeters: 560,
      lanes: 2,
      speedLimitKph: 50,
      isOneWay: false,
      surface: 'asphalt',
      hasSidewalk: true,
      hasBicycleLane: false,
      trafficControl: 'signals',
      hasLaneMarkings: true,
      startNodeId: 'DET_N04',
      endNodeId: 'DET_N05',
      avSimReady: true
    }
  ]
};

// Recalculate accurate lengths for all segments
function ensureAccurateLengths(bundle: DatasetBundle): DatasetBundle {
  const updatedSegments = bundle.segments.map(seg => ({
    ...seg,
    lengthMeters: Math.round(calculatePolylineLength(seg.coordinates) * 10) / 10
  }));
  return { ...bundle, segments: updatedSegments };
}

export const ALL_BENCHMARK_DATASETS: Record<string, DatasetBundle> = {
  sf_av_urban: ensureAccurateLengths(SF_AV_TEST_DATASET),
  detroit_proving_ground: ensureAccurateLengths(DETROIT_PROVING_GROUND_DATASET)
};
