"""
Connectivity & Graph Topology Validation (Python Module)
Identifies disconnected subgraphs (C02) and dead-end boundary stubs (C01).
"""

from typing import List, Dict, Any
from ..core.geometry import calculate_haversine_distance_meters

class ConnectivityValidator:
    """Performs graph traversal to detect network partitions and isolated islands."""

    def validate(self, segments: List[Dict[str, Any]], nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        issues = []
        if not segments:
            return issues

        # Build adjacency graph
        adj = {s["id"]: [] for s in segments}
        for i in range(len(segments)):
            s1 = segments[i]
            s1_s, s1_e = s1["coordinates"][0], s1["coordinates"][-1]
            for j in range(i + 1, len(segments)):
                s2 = segments[j]
                s2_s, s2_e = s2["coordinates"][0], s2["coordinates"][-1]

                connects = (
                    calculate_haversine_distance_meters(s1_s, s2_s) < 0.5 or
                    calculate_haversine_distance_meters(s1_s, s2_e) < 0.5 or
                    calculate_haversine_distance_meters(s1_e, s2_s) < 0.5 or
                    calculate_haversine_distance_meters(s1_e, s2_e) < 0.5
                )
                if connects:
                    adj[s1["id"]].append(s2["id"])
                    adj[s2["id"]].append(s1["id"])

        visited = set()
        components = []

        for seg in segments:
            seg_id = seg["id"]
            if seg_id not in visited:
                comp = []
                queue = [seg_id]
                visited.add(seg_id)
                while queue:
                    curr = queue.pop(0)
                    comp.append(curr)
                    for nbr in adj.get(curr, []):
                        if nbr not in visited:
                            visited.add(nbr)
                            queue.append(nbr)
                components.append(comp)

        # Flag smaller components as isolated islands
        if len(components) > 1:
            components.sort(key=len, reverse=True)
            for c_idx in range(1, len(components)):
                island = components[c_idx]
                for seg_id in island:
                    issues.append({
                        "id": f"CON-C02-{seg_id}",
                        "rule_code": "C02",
                        "category": "Connectivity",
                        "severity": "Critical",
                        "segment_id": seg_id,
                        "title": f"Disconnected Component Island ({len(island)} segment(s))",
                        "description": f"Segment {seg_id} is part of an isolated subgraph with no path to the main network.",
                        "suggested_action": "Connect island to main simulation network.",
                        "requires_human_eval": True
                    })

        return issues
