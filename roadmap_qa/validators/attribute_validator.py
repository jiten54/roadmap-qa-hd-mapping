"""
Attribute & Traffic Control Validation (Python Module)
Enforces L01 (speed limits), L02 (lane count plausibility), and L04 (one-way sink traps).
"""

from typing import List, Dict, Any
from ..core.geometry import calculate_haversine_distance_meters

class AttributeValidator:
    """Validates road attributes for autonomous driving motion planning and routing."""

    def validate(self, segments: List[Dict[str, Any]], nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        issues = []

        for seg in segments:
            # L01: Speed limit
            speed = seg.get("speed_kph", seg.get("speedLimitKph", 0))
            if speed <= 0:
                issues.append({
                    "id": f"ATT-L01-{seg['id']}",
                    "rule_code": "L01",
                    "category": "Lane Attributes",
                    "severity": "Critical",
                    "segment_id": seg["id"],
                    "title": "Missing Speed Limit Attribute",
                    "description": f"Segment {seg['id']} lacks a positive lawful speed limit.",
                    "suggested_action": "Assign jurisdiction statutory speed limit based on road class.",
                    "requires_human_eval": False
                })

            # L02: Lane count plausibility
            lanes = seg.get("lanes", 1)
            road_class = seg.get("road_class", seg.get("roadClass", "residential"))
            if road_class == "residential" and lanes > 4:
                issues.append({
                    "id": f"ATT-L02-{seg['id']}",
                    "rule_code": "L02",
                    "category": "Lane Attributes",
                    "severity": "Major",
                    "segment_id": seg["id"],
                    "title": f"Excessive Lane Count for Residential Street ({lanes} lanes)",
                    "description": f"Residential road {seg['id']} has {lanes} lanes, exceeding standard curb-to-curb width.",
                    "suggested_action": "Verify against aerial imagery and adjust to 1-2 lanes.",
                    "requires_human_eval": True
                })

        # L04: One-way sink trap check
        for node in nodes:
            connected = [
                s for s in segments
                if calculate_haversine_distance_meters(s["coordinates"][0], node["coordinates"]) < 0.1 or
                   calculate_haversine_distance_meters(s["coordinates"][-1], node["coordinates"]) < 0.1
            ]
            if len(connected) == 1 and connected[0].get("is_one_way", connected[0].get("isOneWay", False)):
                seg = connected[0]
                is_entering = calculate_haversine_distance_meters(seg["coordinates"][-1], node["coordinates"]) < 0.1
                if is_entering:
                    issues.append({
                        "id": f"TRF-L04-{node['id']}",
                        "rule_code": "L04",
                        "category": "Traffic Control",
                        "severity": "Critical",
                        "segment_id": seg["id"],
                        "node_id": node["id"],
                        "title": "One-Way Vehicle Sink Trap at Dead-End",
                        "description": f"One-way segment {seg['id']} enters dead-end Node {node['id']} with no egress edge.",
                        "suggested_action": "Convert to two-way or add turnaround loop.",
                        "requires_human_eval": False
                    })

        return issues
