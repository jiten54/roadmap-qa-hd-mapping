"""
Automated Quality Validation Test Suite for RoadMap QA
Tests core rules against known ground truth synthetic fixtures.
Compatible with pytest and Python standard library unittest.
"""

import unittest
from roadmap_qa.validators.geometry_validator import GeometryValidator
from roadmap_qa.validators.connectivity_validator import ConnectivityValidator
from roadmap_qa.validators.attribute_validator import AttributeValidator
from roadmap_qa.reporting.audit_db import QualityDatabase

class TestRoadMapQAValidation(unittest.TestCase):

    def setUp(self):
        self.geo_validator = GeometryValidator(snapping_tolerance_m=2.5, min_segment_length_m=3.0, acute_angle_deg=20.0)
        self.conn_validator = ConnectivityValidator()
        self.attr_validator = AttributeValidator()

    def test_g01_microsegment_detection(self):
        """Rule G01: Micro-segment shorter than 3.0m must be flagged as Critical."""
        segments = [{
            "id": "SEG_MICRO_TEST",
            "coordinates": [(-122.3970, 37.7870), (-122.397008, 37.787006)] # ~0.95m
        }]
        nodes = []
        issues = self.geo_validator.validate(segments, nodes)
        g01_issues = [i for i in issues if i["rule_code"] == "G01"]
        self.assertEqual(len(g01_issues), 1)
        self.assertEqual(g01_issues[0]["severity"], "Critical")
        self.assertEqual(g01_issues[0]["segment_id"], "SEG_MICRO_TEST")

    def test_g03_duplicate_geometry_detection(self):
        """Rule G03: Identical or inverted polylines must be flagged as duplicates."""
        coords = [(-122.4020, 37.7865), (-122.3990, 37.7865)]
        segments = [
            {"id": "SEG_ORIGINAL", "coordinates": coords},
            {"id": "SEG_DUPLICATE", "coordinates": coords}
        ]
        nodes = []
        issues = self.geo_validator.validate(segments, nodes)
        g03_issues = [i for i in issues if i["rule_code"] == "G03"]
        self.assertEqual(len(g03_issues), 1)
        self.assertEqual(g03_issues[0]["severity"], "Critical")

    def test_g04_snapping_gap_detection(self):
        """Rule G04: Road endpoint within 2.5m of an intersection node must be flagged."""
        # 37.78402 is 2.22m north of 37.78400
        segments = [{
            "id": "SEG_GAP_TEST",
            "coordinates": [(-122.3975, 37.7852), (-122.3975, 37.78402)]
        }]
        nodes = [{
            "id": "NODE_10",
            "coordinates": (-122.3975, 37.78400)
        }]
        issues = self.geo_validator.validate(segments, nodes)
        g04_issues = [i for i in issues if i["rule_code"] == "G04"]
        self.assertEqual(len(g04_issues), 1)
        self.assertEqual(g04_issues[0]["severity"], "Critical")

    def test_g05_acute_approach_angle(self):
        """Rule G05: Convergence angle sharper than 20° must be flagged."""
        node = {"id": "NODE_ACUTE", "coordinates": (-122.3960, 37.7865)}
        segments = [
            {"id": "SEG_MAIN", "coordinates": [(-122.3960, 37.7865), (-122.3990, 37.7865)]},
            {"id": "SEG_SLIP", "coordinates": [(-122.3960, 37.7865), (-122.3985, 37.7868)]} # 14.2°
        ]
        issues = self.geo_validator.validate(segments, [node])
        g05_issues = [i for i in issues if i["rule_code"] == "G05"]
        self.assertEqual(len(g05_issues), 1)
        self.assertEqual(g05_issues[0]["severity"], "Major")

    def test_c02_isolated_subgraph_detection(self):
        """Rule C02: Disconnected road component must be flagged as an isolated island."""
        segments = [
            {"id": "SEG_MAIN_1", "coordinates": [(-122.4020, 37.7890), (-122.3990, 37.7890)]},
            {"id": "SEG_MAIN_2", "coordinates": [(-122.3990, 37.7890), (-122.3960, 37.7890)]},
            # Isolated island
            {"id": "SEG_ISLAND", "coordinates": [(-122.4040, 37.7875), (-122.4040, 37.7855)]}
        ]
        issues = self.conn_validator.validate(segments, [])
        c02_issues = [i for i in issues if i["rule_code"] == "C02"]
        self.assertEqual(len(c02_issues), 1)
        self.assertEqual(c02_issues[0]["segment_id"], "SEG_ISLAND")

    def test_l01_missing_speed_limit(self):
        """Rule L01: Speed limit missing or <= 0 must be flagged as Critical."""
        segments = [{
            "id": "SEG_NO_SPEED",
            "coordinates": [(-122.3960, 37.7875), (-122.3930, 37.7875)],
            "speed_kph": 0,
            "road_class": "primary"
        }]
        issues = self.attr_validator.validate(segments, [])
        l01_issues = [i for i in issues if i["rule_code"] == "L01"]
        self.assertEqual(len(l01_issues), 1)
        self.assertEqual(l01_issues[0]["severity"], "Critical")

    def test_l04_oneway_sink_trap(self):
        """Rule L04: One-way road entering dead-end with no exit must be flagged."""
        node = {"id": "NODE_DEADEND", "coordinates": (-122.4005, 37.7850)}
        segments = [{
            "id": "SEG_SINK",
            "coordinates": [(-122.3990, 37.7850), (-122.4005, 37.7850)],
            "is_one_way": True
        }]
        issues = self.attr_validator.validate(segments, [node])
        l04_issues = [i for i in issues if i["rule_code"] == "L04"]
        self.assertEqual(len(l04_issues), 1)
        self.assertEqual(l04_issues[0]["severity"], "Critical")

    def test_sqlite_audit_persistence(self):
        """Database: SQLite audit trail records decisions and queries correctly."""
        db = QualityDatabase(":memory:")
        issue = {
            "id": "TEST-ISSUE-01",
            "rule_code": "G01",
            "category": "Geometry",
            "severity": "Critical",
            "title": "Test Microsegment",
            "description": "Test description",
            "suggested_action": "Merge segment"
        }
        db.save_issues([issue])
        db.log_decision(
            issue_id="TEST-ISSUE-01",
            actor="SimForge Analyst",
            action="RESOLVE",
            prev_status="Open",
            new_status="Resolved",
            notes="Manually merged in QGIS"
        )
        saved = db.get_all_issues()
        self.assertEqual(len(saved), 1)
        self.assertEqual(saved[0]["status"], "Resolved")
        self.assertEqual(saved[0]["reviewer_notes"], "Manually merged in QGIS")

if __name__ == "__main__":
    unittest.main()
