"""
Geometry Validation Engine (Python Module)
Enforces rules G01 (microsegments), G03 (duplicates), G04 (snapping gaps), and G05 (acute angles).
"""

from typing import List, Dict, Any, Tuple
from ..core.geometry import (
    calculate_haversine_distance_meters,
    calculate_approach_angle,
    calculate_polyline_length_meters
)

class GeometryValidator:
    """Validates physical centerline coordinates for autonomous vehicle simulation."""

    def __init__(self, snapping_tolerance_m: float = 2.5, min_segment_length_m: float = 3.0, acute_angle_deg: float = 20.0):
        self.snapping_tolerance_m = snapping_tolerance_m
        self.min_segment_length_m = min_segment_length_m
        self.acute_angle_deg = acute_angle_deg

    def validate(self, segments: List[Dict[str, Any]], nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        issues = []

        # 1. Micro-segment & duplicate check
        for i, seg in enumerate(segments):
            length = calculate_polyline_length_meters(seg["coordinates"])
            if length < self.min_segment_length_m:
                issues.append({
                    "id": f"GEO-G01-{seg['id']}",
                    "rule_code": "G01",
                    "category": "Geometry",
                    "severity": "Critical",
                    "segment_id": seg["id"],
                    "title": f"Micro-Segment ({length:.2f}m < {self.min_segment_length_m}m)",
                    "description": f"Segment {seg['id']} length {length:.2f}m is below threshold {self.min_segment_length_m}m.",
                    "suggested_action": "Merge micro-segment or delete if topological artifact.",
                    "requires_human_eval": False
                })

            for j in range(i + 1, len(segments)):
                other = segments[j]
                d_start = calculate_haversine_distance_meters(seg["coordinates"][0], other["coordinates"][0])
                d_end = calculate_haversine_distance_meters(seg["coordinates"][-1], other["coordinates"][-1])
                d_rev1 = calculate_haversine_distance_meters(seg["coordinates"][0], other["coordinates"][-1])
                d_rev2 = calculate_haversine_distance_meters(seg["coordinates"][-1], other["coordinates"][0])

                if (d_start < 1.0 and d_end < 1.0) or (d_rev1 < 1.0 and d_rev2 < 1.0):
                    issues.append({
                        "id": f"GEO-G03-{seg['id']}",
                        "rule_code": "G03",
                        "category": "Geometry",
                        "severity": "Critical",
                        "segment_id": seg["id"],
                        "title": f"Duplicate Segment Geometry with {other['id']}",
                        "description": f"Segment {seg['id']} shares identical trajectory with {other['id']}.",
                        "suggested_action": "Remove duplicate centerline record.",
                        "requires_human_eval": False
                    })

            # Snapping gaps
            start_pt = seg["coordinates"][0]
            end_pt = seg["coordinates"][-1]
            for node in nodes:
                d_s = calculate_haversine_distance_meters(start_pt, node["coordinates"])
                d_e = calculate_haversine_distance_meters(end_pt, node["coordinates"])
                if 0.15 < d_s <= self.snapping_tolerance_m:
                    issues.append({
                        "id": f"GEO-G04-{seg['id']}-start",
                        "rule_code": "G04",
                        "category": "Geometry",
                        "severity": "Critical",
                        "segment_id": seg["id"],
                        "node_id": node["id"],
                        "title": f"Snapping Gap ({d_s:.2f}m from {node['id']})",
                        "description": f"Segment {seg['id']} start is {d_s:.2f}m from Node {node['id']} without snap.",
                        "suggested_action": f"Snap endpoint to Node {node['id']}.",
                        "requires_human_eval": True
                    })
                if 0.15 < d_e <= self.snapping_tolerance_m:
                    issues.append({
                        "id": f"GEO-G04-{seg['id']}-end",
                        "rule_code": "G04",
                        "category": "Geometry",
                        "severity": "Critical",
                        "segment_id": seg["id"],
                        "node_id": node["id"],
                        "title": f"Snapping Gap ({d_e:.2f}m from {node['id']})",
                        "description": f"Segment {seg['id']} end is {d_e:.2f}m from Node {node['id']} without snap.",
                        "suggested_action": f"Snap endpoint to Node {node['id']}.",
                        "requires_human_eval": True
                    })

        # 2. Acute angles
        for node in nodes:
            connected = [
                s for s in segments
                if calculate_haversine_distance_meters(s["coordinates"][0], node["coordinates"]) < 0.1 or
                   calculate_haversine_distance_meters(s["coordinates"][-1], node["coordinates"]) < 0.1
            ]
            if len(connected) >= 2:
                for m in range(len(connected)):
                    for n in range(m + 1, len(connected)):
                        s1, s2 = connected[m], connected[n]
                        p1 = s1["coordinates"][-1] if calculate_haversine_distance_meters(s1["coordinates"][0], node["coordinates"]) < 0.1 else s1["coordinates"][0]
                        p2 = s2["coordinates"][-1] if calculate_haversine_distance_meters(s2["coordinates"][0], node["coordinates"]) < 0.1 else s2["coordinates"][0]
                        angle = calculate_approach_angle(node["coordinates"], p1, p2)
                        if 1.0 < angle < self.acute_angle_deg:
                            issues.append({
                                "id": f"GEO-G05-{node['id']}",
                                "rule_code": "G05",
                                "category": "Geometry",
                                "severity": "Major",
                                "node_id": node["id"],
                                "title": f"Acute Approach Angle ({angle:.1f}° < {self.acute_angle_deg}°)",
                                "description": f"Sharp junction between {s1['id']} and {s2['id']} at Node {node['id']}.",
                                "suggested_action": "Taper slipway or re-align approach centerline.",
                                "requires_human_eval": True
                            })

        return issues
