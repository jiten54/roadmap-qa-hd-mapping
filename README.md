# RoadMap QA — HD Mapping & Quality Validation System
<img width="1914" height="869" alt="Screenshot 2026-10-16 045612" src="https://github.com/user-attachments/assets/5bb770fa-4fd9-4bbf-b861-5b2f0ea55cdb" />

A GIS-based road network mapping and quality assurance project designed to validate road geometry, analyze network connectivity, check map attributes, and generate geospatial quality reports.

## Overview

RoadMap QA is a geospatial analytics portfolio project focused on improving the structural quality and consistency of digital road-network data used in mapping, navigation, simulation, and autonomous driving applications.

The system processes road-network datasets, identifies potential geometry and connectivity issues, validates road attributes, and provides a structured workflow for reviewing and documenting map-quality problems.

The project demonstrates practical skills in geospatial data processing, analytical reasoning, data validation, quality assurance, and Excel reporting.

## Objectives

- Import and inspect road-network datasets.
- Validate road geometry and feature attributes.
- Identify duplicate or incomplete road records.
- Analyze road-network connectivity and potential gaps.
- Validate road classifications, directions, and speed-limit attributes.
- Review lane and traffic-control information where available.
- Maintain a quality issue log and track corrections.
- Generate Excel reports and GIS-compatible exports.

## Key Features

### 1. Geospatial Data Import

Support common GIS formats, including:

- GeoJSON
- GeoPackage
- Shapefile
- CSV files containing coordinates and road attributes

Validate input structures, coordinate reference systems, missing geometries, and required fields before processing.

### 2. Interactive Road Map

Visualize road segments, intersections, road classifications, and flagged quality issues on an interactive map.

Allow users to inspect individual features, filter map layers, and review associated road attributes.

### 3. Geometry Validation

Identify potential issues such as:

- Invalid or empty geometries
- Duplicate road segments
- Zero-length features
- Unexpected geometry types
- Suspicious road endpoints
- Missing road attributes

### 4. Network Connectivity Analysis

Analyze road segments as a graph to identify disconnected components, isolated segments, possible network gaps, and unusual intersection connectivity.

Connectivity checks use documented assumptions and appropriate distance tolerances.

### 5. Road Attribute Validation

Check road classifications, direction attributes, speed limits, lane counts, and other available fields for missing or inconsistent values.

Lane connectivity, traffic signs, signals, and lane markings require suitable source data and must be verified independently.

### 6. Quality Assurance Workflow

Maintain a structured issue register containing:

- Issue ID
- Road segment ID
- Issue category
- Severity
- Location
- Description
- Suggested corrective action
- Review status
- Reviewer notes

Support review statuses such as Open, Under Review, Resolved, and False Positive.

### 7. Excel Reporting

Generate structured reports covering road inventory, geometry checks, connectivity issues, attribute completeness, and quality-review status.

Reports should use readable formatting, filters, conditional formatting, and summary charts where appropriate.

### 8. GIS Data Export

Export validated or reviewed data in appropriate formats, including GeoJSON, GeoPackage, and CSV, while preserving original records and documenting any changes.

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Application logic |
| Streamlit | Interactive interface |
| GeoPandas | Geospatial data processing |
| Shapely | Geometry validation |
| OSMnx | Road-network data processing |
| Pandas and NumPy | Data analysis |
| Folium | Interactive map visualization |
| Plotly | Charts and reporting |
| SQLite | Quality issue storage |
| OpenPyXL | Excel report generation |
| Pytest | Automated testing |

Adjust this list to match the technologies actually implemented in the repository.

## Project Workflow

1. Import a road-network dataset.
2. Inspect its coordinate reference system and attributes.
3. Validate geometry and required fields.
4. Analyze road-network connectivity.
5. Flag suspicious or incomplete records.
6. Review issues and document decisions.
7. Export quality reports and GIS-compatible files.

## Installation

### Prerequisites

- Python 3.10 or later
- Git
- A supported operating system

### Clone the Repository

```bash
git clone https://github.com/jiten54/roadmap-qa-hd-mapping.git
cd roadmap-qa-hd-mapping
```

### Create a Virtual Environment

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

On Linux or macOS:

```bash
source .venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run the Application

```bash
streamlit run app.py
```

Adjust the entry-point filename if the final project uses a different structure.

## Testing

Run automated tests with:

```bash
pytest
```

Tests should cover geometry validation, missing attributes, duplicate detection, connectivity checks, and export behavior.

Document actual test results rather than claiming unverified performance.

## Sample Data and Evaluation

The project can use synthetic road networks for reproducible demonstrations and permitted public geospatial datasets for additional testing.

Synthetic datasets should contain known examples of disconnected segments, duplicate features, invalid geometries, and missing attributes.

Validation results should be compared against expected outcomes. Do not report fabricated accuracy figures or present synthetic results as real-world mapping performance.

## Limitations

- Geometric checks cannot establish that a road matches the real world without reliable reference data.
- Connectivity findings depend on coordinate systems, snapping tolerances, and network assumptions.
- Lane-level geometry, traffic controls, and road markings require appropriate detailed source data.
- Automated flags identify potential issues; human verification may still be necessary.

## Future Improvements

- Add detailed lane-level map editing.
- Support LiDAR-derived road features where suitable data is available.
- Add reference imagery comparison.
- Improve intersection and navigation connectivity validation.
- Introduce reviewer permissions and richer audit history.
- Add automated regression tests for map-quality rules.

## Skills Demonstrated

- Geospatial data processing
- Road-network validation
- Geometry and attribute quality checks
- Network connectivity analysis
- GIS data formats and coordinate systems
- Data cleaning and verification
- Excel reporting
- Structured quality assurance
- Documentation and testing

## Disclaimer

RoadMap QA is an independent portfolio project and is not affiliated with or endorsed by SimForge. It does not claim professional-grade HD map accuracy unless that capability has been independently implemented and validated.

## Author

**Jiten Moni Das**

GitHub: https://github.com/jiten54

---

*Developed as a portfolio project to demonstrate geospatial data validation and mapping quality assurance skills relevant to entry-level Mapping Analyst roles.*
