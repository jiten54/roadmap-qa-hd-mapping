"""
Geodesic Geometry Utilities for Road Networks
Metric distance, bearing, and approach angle algorithms.
"""

import math
from typing import List, Tuple

EARTH_RADIUS_METERS = 6371008.8

def calculate_haversine_distance_meters(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """Calculates great-circle distance between two [lng, lat] coordinates in meters."""
    lon1, lat1 = coord1
    lon2, lat2 = coord2

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return EARTH_RADIUS_METERS * c

def calculate_polyline_length_meters(coordinates: List[Tuple[float, float]]) -> float:
    """Calculates total length of a polyline in meters."""
    if len(coordinates) < 2:
        return 0.0
    total = 0.0
    for i in range(len(coordinates) - 1):
        total += calculate_haversine_distance_meters(coordinates[i], coordinates[i + 1])
    return total

def calculate_bearing_degrees(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
    """Calculates initial compass bearing (0-360) from coord1 to coord2."""
    lon1, lat1 = math.radians(coord1[0]), math.radians(coord1[1])
    lon2, lat2 = math.radians(coord2[0]), math.radians(coord2[1])

    y = math.sin(lon2 - lon1) * math.cos(lat2)
    x = (math.cos(lat1) * math.sin(lat2) -
         math.sin(lat1) * math.cos(lat2) * math.cos(lon2 - lon1))
    theta = math.atan2(y, x)
    return (math.degrees(theta) + 360.0) % 360.0

def calculate_approach_angle(
    node_coord: Tuple[float, float],
    arm1_coord: Tuple[float, float],
    arm2_coord: Tuple[float, float]
) -> float:
    """Calculates convergence angle between two road approaches meeting at an intersection node."""
    b1 = calculate_bearing_degrees(node_coord, arm1_coord)
    b2 = calculate_bearing_degrees(node_coord, arm2_coord)
    diff = abs(b1 - b2)
    if diff > 180.0:
        diff = 360.0 - diff
    return diff
