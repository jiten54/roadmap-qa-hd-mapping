"""
Coordinate Reference System (CRS) Handling Module
Supports WGS84 (EPSG:4326) angular coordinates and UTM projected metric systems.
"""

import math
from typing import Tuple

EARTH_RADIUS_METERS = 6371008.8

class CoordinateSystemManager:
    """Manages geographic and projected coordinate transformations for road networks."""

    @staticmethod
    def get_utm_epsg_for_longitude(lon: float, lat: float) -> str:
        """Determines the appropriate UTM EPSG code for a given longitude/latitude."""
        zone = int(math.floor((lon + 180.0) / 6.0)) + 1
        is_northern = lat >= 0
        epsg_code = 32600 + zone if is_northern else 32700 + zone
        return f"EPSG:{epsg_code}"

    @staticmethod
    def validate_wgs84_bounds(lon: float, lat: float) -> bool:
        """Validates that coordinates lie within lawful WGS84 bounds [-180, 180] and [-90, 90]."""
        return -180.0 <= lon <= 180.0 and -90.0 <= lat <= 90.0
