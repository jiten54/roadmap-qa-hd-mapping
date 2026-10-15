/**
 * Geodesic Math Utilities for RoadMap QA
 * Supports metric calculations using WGS84 ellipsoid approximations
 */

// Earth radius in meters
const EARTH_RADIUS_METERS = 6371008.8;

/**
 * Calculates Haversine distance in meters between two coordinates [lng, lat]
 */
export function calculateDistanceMeters(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates total length of a polyline in meters
 */
export function calculatePolylineLength(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += calculateDistanceMeters(coordinates[i], coordinates[i + 1]);
  }
  return total;
}

/**
 * Calculates compass bearing (degrees 0-360) from coord1 to coord2
 */
export function calculateBearing(coord1: [number, number], coord2: [number, number]): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const lambda1 = (lon1 * Math.PI) / 180;
  const lambda2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
  const theta = Math.atan2(y, x);
  const bearing = ((theta * 180) / Math.PI + 360) % 360;

  return bearing;
}

/**
 * Calculates minimum angle between two road approaches meeting at an intersection
 */
export function calculateApproachAngle(
  nodeCoord: [number, number],
  arm1FarCoord: [number, number],
  arm2FarCoord: [number, number]
): number {
  const bearing1 = calculateBearing(nodeCoord, arm1FarCoord);
  const bearing2 = calculateBearing(nodeCoord, arm2FarCoord);

  let diff = Math.abs(bearing1 - bearing2);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Checks if two coordinates are within a snapping distance tolerance (in meters)
 */
export function areCoordsWithinTolerance(
  coord1: [number, number],
  coord2: [number, number],
  toleranceMeters: number
): boolean {
  return calculateDistanceMeters(coord1, coord2) <= toleranceMeters;
}

/**
 * Computes bounding box [[minLat, minLng], [maxLat, maxLng]]
 */
export function computeBoundingBox(coords: [number, number][]): [[number, number], [number, number]] {
  if (coords.length === 0) {
    return [[37.77, -122.42], [37.78, -122.41]];
  }

  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];

  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  // Leaflet bounds format: [[south, west], [north, east]] = [[minLat, minLng], [maxLat, maxLng]]
  return [[minLat, minLng], [maxLat, maxLng]];
}

/**
 * Computes midpoint of a polyline for label/marker placement
 */
export function computePolylineMidpoint(coordinates: [number, number][]): [number, number] {
  if (coordinates.length === 0) return [0, 0];
  if (coordinates.length === 1) return coordinates[0];

  const midIndex = Math.floor(coordinates.length / 2);
  return coordinates[midIndex];
}
