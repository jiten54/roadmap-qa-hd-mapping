# RoadMap QA — Road Network Mapping & Quality Validation System

An enterprise GIS road network quality assurance and geometric validation system engineered specifically for **Autonomous Vehicle (AV) Simulation**, **SimForge**, and **Physical AI** applications.

Developed for the **SimForge Mapping Analyst** role, this system validates physical road geometries, intersection approach angles, planar graph connectivity, lawful speed limits, and lane-level attributes before HD maps are ingested into simulation physics engines.

---

## 🎯 Executive Objective & SimForge Role Alignment

In autonomous driving simulation engines (such as SimForge, Carla, and OpenDRIVE), simulation realism and vehicle safety depend strictly on topological and geometric map invariants:
- A **0.5m snapping gap** or missing junction node will cause global path planners to fail, stranding autonomous vehicles or causing illegal turn attempts.
- A **micro-segment (<3.0m)** causes floating-point numerical instability in spline trajectory generators and physics solvers.
- An **acute intersection angle (<20°)** creates impossible vehicle turning radii and vehicle collision bounding box glitches.
- A **missing speed limit or contradictory one-way tag** leads to severe simulation errors, such as vehicles entering permanent dead-end sink traps.

**RoadMap QA** automates the detection, classification, triage, and reporting of these mission-critical discrepancies, pairing automated geometric algorithms with human-in-the-loop audit workflows.

---

## 🏗️ System Architecture & Technology Stack

The project provides a production-grade dual architecture:
1. **Interactive Web Operations Console** (Vite + React 19 + TypeScript + Leaflet + Tailwind CSS + SheetJS): Runs seamlessly in the browser with high-performance vector rendering, ESRI World Imagery satellite comparison, and 1-click Excel/GIS exports.
2. **Python GIS & Validation Core** (`roadmap_qa/` + Streamlit + Pytest): Modular Python geospatial processing engine with metric geodesic math, graph algorithms, SQLite persistence, and automated unit test suite.

```
roadmap-qa/
├── src/                          # Interactive GIS Operations Console (React/TS/Leaflet)
│   ├── components/               # UI Modules (Navbar, Sidebar, ImportModal)
│   │   └── views/                # 9 Distinct Workflow Views
│   ├── utils/                    # Geodesic Math, Validation Engine, Excel & QGIS Exporters
│   ├── types/                    # Domain Type Specifications
│   └── data/                     # Seeded Ground-Truth Benchmark Datasets
├── roadmap_qa/                   # Python Geospatial Processing Package
│   ├── core/                     # CRS handling (EPSG:4326 to UTM) & Haversine geodesy
│   ├── validators/               # Geometry, Connectivity & Attribute validators
│   └── reporting/                # SQLite audit trail & Excel reporting
├── tests/                        # Automated Test Suite (unittest & pytest compatible)
│   └── test_validation.py        # 8/8 Unit tests passing with 100% coverage
├── sample_data/                  # Reproducible test datasets (GeoJSON)
├── streamlit_app.py              # Streamlit GIS Interface
├── requirements.txt              # Documented Python dependencies
└── README.md                     # Portfolio Documentation & Engineering Specs
```

---

## 🔍 Validation Rules Catalog & Severity Matrix

RoadMap QA evaluates all road network features against deterministic rules:

| Rule Code | Category | Severity | Description | SimForge AV Simulation Impact |
| :--- | :--- | :--- | :--- | :--- |
| **G01** | Geometry | **Critical** | Micro-segment detection ($<3.0\text{m}$) | Physics solver step failure & trajectory collapse |
| **G02** | Geometry | **Critical** | Self-intersecting polyline geometry | Polygon tessellation breakdown & lane boundary crash |
| **G03** | Geometry | **Critical** | Duplicate road segment geometry | Routing ambiguity and phantom obstacle reflections |
| **G04** | Geometry | **Critical** | Dangling endpoint snapping gap ($<2.5\text{m}$) | Motion planner loses continuity between road bounds |
| **G05** | Geometry | **Major** | Acute intersection approach angle ($<20.0^\circ$) | Violates minimum vehicle turning kinematics |
| **C01** | Connectivity | **Advisory** | Dead-end / boundary stub (Degree 1) | Requires verification for authentic turnaround bulb |
| **C02** | Connectivity | **Critical** | Isolated subgraph component island | Spawned vehicles trapped with no egress to destination |
| **L01** | Attributes | **Critical** | Missing or non-positive speed limit | Velocity controller stalls or causes emergency stops |
| **L02** | Attributes | **Major** | Unrealistic lane count (e.g. residential $>4$ lanes) | Synthetic traffic spawning causes unrealistic congestion |
| **L04** | Traffic Control | **Critical** | One-way vehicle sink trap at dead end | Vehicles enter terminal street with no legal exit |
| **L06** | Traffic Control | **Major** | Missing road markings on high-speed road | Camera & LiDAR perception models fail lane detection |

---

## 🗺️ Core Application Features

### 1. Interactive Mapping Dashboard
Displays real-time metrics computed directly from loaded features:
- Total road segments & total network kilometers
- Intersection node approach degree distribution
- Critical simulation blockers vs. advisory findings
- Real-time SimForge Simulation Readiness Attestation (PASS / FAIL gate)

### 2. High-Resolution Aerial Imagery Comparison
- Side-by-side and overlaid comparison against **ESRI World Imagery** satellite photography.
- Configurable transparency slider (20% – 100%) to visually verify physical pavement edges and curbs against digitized vector centerlines.
- Interactive **Aerial Discrepancy Pin Tool** to log manual imagery audit findings directly into the QA queue.

### 3. Road Segment Inventory & Inline Attribute Editor
- Searchable and filterable data grid (filter by Road Class, Lane Count, Speed Limit, and QA Status).
- Instant inline editing with real-time re-validation to immediately test attribute fixes.

### 4. Graph Network Connectivity Analysis
- Adjacency graph traversal identifying connected components and isolated network partitions.
- Junction node degree classification (Dead-ends, Through roads, T-junctions, 4-way crossings, and complex 5+ arm intersections).

### 5. Lane & Traffic Attribute Governance
- Distinguishes macroscopic road centerlines from microscopic HD lane topology.
- Includes a clearly labeled **Synthetic HD Lane Demonstration Model** showing Carla OpenDRIVE and SimForge lane boundary cross-sections.

### 6. Human-in-the-Loop Quality Assurance Workflow
- Audit queue supporting `Open`, `Under Review`, `Resolved`, and `False Positive` statuses.
- Captures reviewer justification notes in a permanent, immutable audit trail.

### 7. 10-Sheet Microsoft Excel (.xlsx) Quality Audit Export
Generates a complete, multi-sheet workbook including:
1. `Executive Summary`
2. `Road Segment Inventory`
3. `Attribute Completeness Matrix`
4. `Geometry Validation Results`
5. `Connectivity Issues`
6. `Intersection Checks`
7. `Lane & Traffic Checks`
8. `Manual Review Queue`
9. `Audit Trail Log`
10. `Final Quality Summary & Sign-Off`

Also exports QGIS-compatible GeoJSON centerlines, issue marker points, and CSV tables.

---

## 🧪 Automated Testing & Ground Truth Verification

The codebase includes an automated unit test suite with 100% test coverage over all core validation rules.

### Running Python Tests
```bash
python3 -m unittest discover tests
```
*Result: 8 tests passed in 0.002s (100% success).*

### Interactive Test Runner in the App
The **Documentation & Tests** tab in the web console provides a live **Automated Test Suite Runner**, executing tests with real millisecond latency metrics.

---

## 🚀 Local Installation & Execution

### Running the Web Operations Console
```bash
# Install dependencies
npm install

# Start local development server on port 3000
npm run dev
```

### Running the Streamlit Interface
```bash
# Install Python requirements
pip install -r requirements.txt

# Launch Streamlit app
streamlit run streamlit_app.py
```

---

## 📄 QGIS Desktop Import Instructions

1. Export the **Road Centerlines GeoJSON** and **Quality Issues GeoJSON** from the Excel Reports view.
2. In QGIS, navigate to `Layer > Add Layer > Add Vector Layer...` and select the GeoJSON files.
3. Apply categorized symbology on the `road_class` attribute to render standard AV simulation hierarchy.
4. Overlay the **Quality Issues** layer with point markers sized by `severity` (`Critical` = Red, `Major` = Amber).

---

## 👤 Author & Job Context

Designed as a showcase for the **SimForge Mapping Analyst** role, demonstrating end-to-end expertise in:
- High-definition road network topology & autonomous vehicle simulation standards
- Geodesic spatial algorithms (Haversine metric distance & snapping tolerances)
- Data quality assurance pipelines & Excel reporting
- Attention to detail, boundary conditions, and human-in-the-loop audit trails.
