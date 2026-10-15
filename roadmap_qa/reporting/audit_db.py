"""
SQLite Quality Audit Database Access Module
Stores road network features, validation results, and audit trails.
"""

import sqlite3
from typing import List, Dict, Any, Optional

class QualityDatabase:
    """Manages SQLite storage for QA issues and immutable audit trails."""

    def __init__(self, db_path: str = "roadmap_qa.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self):
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS validation_issues (
                issue_id TEXT PRIMARY KEY,
                rule_code TEXT NOT NULL,
                category TEXT NOT NULL,
                severity TEXT NOT NULL,
                feature_id TEXT,
                title TEXT NOT NULL,
                description TEXT,
                suggested_action TEXT,
                status TEXT NOT NULL DEFAULT 'Open',
                reviewer_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_trail (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                issue_id TEXT NOT NULL,
                actor TEXT NOT NULL,
                action TEXT NOT NULL,
                previous_status TEXT,
                new_status TEXT,
                notes TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        self.conn.commit()

    def save_issues(self, issues: List[Dict[str, Any]]):
        cursor = self.conn.cursor()
        for issue in issues:
            cursor.execute("""
                INSERT OR REPLACE INTO validation_issues
                (issue_id, rule_code, category, severity, feature_id, title, description, suggested_action, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                issue["id"],
                issue["rule_code"],
                issue["category"],
                issue["severity"],
                issue.get("segment_id", issue.get("node_id", "")),
                issue["title"],
                issue["description"],
                issue["suggested_action"],
                issue.get("status", "Open")
            ))
        self.conn.commit()

    def log_decision(self, issue_id: str, actor: str, action: str, prev_status: str, new_status: str, notes: str):
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO audit_trail (issue_id, actor, action, previous_status, new_status, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (issue_id, actor, action, prev_status, new_status, notes))
        cursor.execute("""
            UPDATE validation_issues SET status = ?, reviewer_notes = ? WHERE issue_id = ?
        """, (new_status, notes, issue_id))
        self.conn.commit()

    def get_all_issues(self) -> List[Dict[str, Any]]:
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM validation_issues ORDER BY severity ASC")
        return [dict(row) for row in cursor.fetchall()]

    def close(self):
        if self.conn:
            self.conn.close()
