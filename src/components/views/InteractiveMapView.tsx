import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  RoadSegment,
  IntersectionNode,
  ValidationIssue,
  RoadClass,
  ReviewStatus
} from '../../types/gis';
import {
  Layers,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Compass,
  ArrowRight,
  PlusCircle,
  FileCheck2,
  MapPin
} from 'lucide-react';
import { calculateBearing } from '../../utils/geoMath';

interface InteractiveMapViewProps {
  segments: RoadSegment[];
  nodes: IntersectionNode[];
  issues: ValidationIssue[];
  center: [number, number]; // [lat, lng]
  zoom: number;
  onUpdateIssueStatus: (issueId: string, status: ReviewStatus, notes?: string) => void;
  onAddManualIssue?: (issue: Partial<ValidationIssue>) => void;
}

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  segments,
  nodes,
  issues,
  center,
  zoom,
  onUpdateIssueStatus,
  onAddManualIssue
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const roadLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const nodeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const issueLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const arrowLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const satelliteTileLayerRef = useRef<L.TileLayer | null>(null);
  const cartoDarkTileLayerRef = useRef<L.TileLayer | null>(null);

  // View States
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssue | null>(null);
  const [basemapMode, setBasemapMode] = useState<'carto' | 'satellite' | 'osm'>('carto');
  const [satelliteOpacity, setSatelliteOpacity] = useState<number>(1.0);
  const [splitCompareMode, setSplitCompareMode] = useState<boolean>(false);

  // Layer Toggles
  const [showRoads, setShowRoads] = useState<boolean>(true);
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [showIssues, setShowIssues] = useState<boolean>(true);
  const [showArrows, setShowArrows] = useState<boolean>(true);
  const [filterClass, setFilterClass] = useState<string>('all');

  // Manual pin tool
  const [isPinningMode, setIsPinningMode] = useState<boolean>(false);
  const [discrepancyNote, setDiscrepancyNote] = useState<string>('');

  // Road color by classification
  const getRoadColor = (roadClass: RoadClass): string => {
    switch (roadClass) {
      case 'motorway': return '#f97316'; // orange-500
      case 'trunk': return '#fbbf24'; // amber-400
      case 'primary': return '#14b8a6'; // teal-500
      case 'secondary': return '#38bdf8'; // sky-400
      case 'tertiary': return '#818cf8'; // indigo-400
      case 'residential': return '#94a3b8'; // slate-400
      case 'service': return '#64748b'; // slate-500
      default: return '#cbd5e1';
    }
  };

  const getRoadWeight = (roadClass: RoadClass): number => {
    switch (roadClass) {
      case 'motorway': return 7;
      case 'trunk': return 6;
      case 'primary': return 5;
      case 'secondary': return 4;
      default: return 3;
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Basemaps
    const cartoDark = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; CartoDB &copy; OpenStreetMap',
        maxZoom: 20
      }
    ).addTo(map);
    cartoDarkTileLayerRef.current = cartoDark;

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri World Imagery',
        maxZoom: 19
      }
    );
    satelliteTileLayerRef.current = satellite;

    // Feature Layer Groups
    const roadGroup = L.layerGroup().addTo(map);
    const nodeGroup = L.layerGroup().addTo(map);
    const issueGroup = L.layerGroup().addTo(map);
    const arrowGroup = L.layerGroup().addTo(map);

    roadLayerGroupRef.current = roadGroup;
    nodeLayerGroupRef.current = nodeGroup;
    issueLayerGroupRef.current = issueGroup;
    arrowLayerGroupRef.current = arrowGroup;

    mapInstanceRef.current = map;

    // Map click handler for manual pin tool
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isPinningMode && onAddManualIssue) {
        onAddManualIssue({
          id: `ISSUE-AERIAL-${Date.now().toString().slice(-4)}`,
          category: 'Visual Aerial Discrepancy',
          severity: 'Major',
          title: 'Manual Aerial Inspection Discrepancy',
          description: discrepancyNote.trim() || 'Visual discrepancy identified during satellite imagery alignment audit.',
          suggestedAction: 'Re-align road centerline to match physical pavement curbs on satellite imagery.',
          coordinates: [e.latlng.lng, e.latlng.lat],
          status: 'Open',
          requiresHumanVerification: true
        });
        setIsPinningMode(false);
        setDiscrepancyNote('');
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoom]);

  // Update Basemap & Opacity
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (cartoDarkTileLayerRef.current) map.removeLayer(cartoDarkTileLayerRef.current);
    if (satelliteTileLayerRef.current) map.removeLayer(satelliteTileLayerRef.current);

    if (basemapMode === 'satellite') {
      if (satelliteTileLayerRef.current) {
        satelliteTileLayerRef.current.setOpacity(satelliteOpacity);
        satelliteTileLayerRef.current.addTo(map);
      }
    } else if (basemapMode === 'carto') {
      if (cartoDarkTileLayerRef.current) {
        cartoDarkTileLayerRef.current.addTo(map);
      }
    } else {
      // Standard OSM
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);
    }
  }, [basemapMode, satelliteOpacity]);

  // Render Vectors & Issues
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const roadGroup = roadLayerGroupRef.current;
    const nodeGroup = nodeLayerGroupRef.current;
    const issueGroup = issueLayerGroupRef.current;
    const arrowGroup = arrowLayerGroupRef.current;

    if (!roadGroup || !nodeGroup || !issueGroup || !arrowGroup) return;

    roadGroup.clearLayers();
    nodeGroup.clearLayers();
    issueGroup.clearLayers();
    arrowGroup.clearLayers();

    // 1. Render Road Centerlines
    if (showRoads) {
      segments.forEach((seg) => {
        if (filterClass !== 'all' && seg.roadClass !== filterClass) return;

        // Convert [lng, lat] to Leaflet [lat, lng]
        const latLngs = seg.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
        const color = getRoadColor(seg.roadClass);
        const weight = getRoadWeight(seg.roadClass);
        const isSelected = selectedSegment?.id === seg.id;

        // Outline glow if selected
        if (isSelected) {
          L.polyline(latLngs, {
            color: '#38bdf8',
            weight: weight + 6,
            opacity: 0.8
          }).addTo(roadGroup);
        }

        const polyline = L.polyline(latLngs, {
          color: isSelected ? '#38bdf8' : color,
          weight: weight,
          opacity: 0.9,
          dashArray: seg.isOneWay ? undefined : undefined
        });

        polyline.on('click', () => {
          setSelectedSegment(seg);
          const related = issues.find(i => i.segmentId === seg.id);
          setSelectedIssue(related || null);
        });

        polyline.bindTooltip(
          `<strong>${seg.name}</strong><br/>Class: ${seg.roadClass} · ${seg.lanes} lanes · ${seg.speedLimitKph || 0} km/h`,
          { sticky: true, className: 'leaflet-custom-tooltip' }
        );

        polyline.addTo(roadGroup);

        // One-way direction arrows
        if (showArrows && seg.isOneWay && seg.coordinates.length >= 2) {
          const midIdx = Math.floor(seg.coordinates.length / 2);
          const c1 = seg.coordinates[midIdx];
          const c2 = seg.coordinates[Math.min(midIdx + 1, seg.coordinates.length - 1)];
          const angle = calculateBearing(c1, c2);

          const arrowIcon = L.divIcon({
            html: `<div style="transform: rotate(${angle}deg); color: #facc15; font-size: 14px; font-weight: bold;">➤</div>`,
            className: 'bg-transparent border-0',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });

          L.marker([c1[1], c1[0]], { icon: arrowIcon }).addTo(arrowGroup);
        }
      });
    }

    // 2. Render Intersection Nodes
    if (showNodes) {
      nodes.forEach((node) => {
        const [lng, lat] = node.coordinates;
        const isSuspicious = node.suspicious;

        const circleMarker = L.circleMarker([lat, lng], {
          radius: isSuspicious ? 7 : node.degree >= 3 ? 5 : 4,
          fillColor: isSuspicious ? '#f43f5e' : node.degree >= 4 ? '#38bdf8' : '#e2e8f0',
          color: '#0f172a',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        });

        circleMarker.bindTooltip(
          `<strong>Node ${node.id}</strong><br/>Degree: ${node.degree} approaches<br/>Control: ${node.trafficControl}${isSuspicious ? `<br/><span style="color: #f43f5e">⚠ ${node.suspiciousReason}</span>` : ''}`,
          { sticky: true }
        );

        circleMarker.addTo(nodeGroup);
      });
    }

    // 3. Render Issue Markers
    if (showIssues) {
      issues.forEach((issue) => {
        const [lng, lat] = issue.coordinates;
        const isCritical = issue.severity === 'Critical';
        const isResolved = issue.status === 'Resolved' || issue.status === 'False Positive';

        let badgeBg = '#f43f5e'; // Critical = Rose
        if (issue.severity === 'Major') badgeBg = '#f59e0b'; // Major = Amber
        if (issue.severity === 'Minor') badgeBg = '#38bdf8'; // Minor = Sky
        if (issue.severity === 'Advisory') badgeBg = '#a855f7'; // Advisory = Purple
        if (isResolved) badgeBg = '#10b981'; // Resolved = Emerald

        const markerHtml = `
          <div class="relative flex items-center justify-center">
            ${isCritical && !isResolved ? '<span class="absolute w-6 h-6 rounded-full bg-rose-500/40 animate-ping"></span>' : ''}
            <div style="background-color: ${badgeBg}; width: 18px; height: 18px; border-radius: 9999px; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 10px; font-weight: bold;">
              ${issue.ruleCode.slice(0, 1)}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'bg-transparent',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        marker.on('click', () => {
          setSelectedIssue(issue);
          if (issue.segmentId) {
            const seg = segments.find(s => s.id === issue.segmentId);
            if (seg) setSelectedSegment(seg);
          }
        });

        marker.bindTooltip(
          `<strong>[${issue.severity}] ${issue.title}</strong><br/>${issue.ruleCode}: ${issue.description}<br/>Status: <em>${issue.status}</em>`,
          { sticky: true }
        );

        marker.addTo(issueGroup);
      });
    }
  }, [segments, nodes, issues, showRoads, showNodes, showIssues, showArrows, filterClass, selectedSegment]);

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      {/* Main Map Canvas */}
      <div className="flex-1 relative h-full">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Map Controls Overlay (Top-Left) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* Basemap Switcher Toolbar */}
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-2.5 shadow-xl flex items-center gap-1.5 text-xs text-slate-300">
            <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-teal-400" /> Basemap:
            </span>
            <button
              onClick={() => setBasemapMode('carto')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                basemapMode === 'carto' ? 'bg-teal-500 text-slate-950 font-bold' : 'hover:bg-slate-800'
              }`}
            >
              Dark GIS
            </button>
            <button
              onClick={() => setBasemapMode('satellite')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                basemapMode === 'satellite' ? 'bg-teal-500 text-slate-950 font-bold' : 'hover:bg-slate-800'
              }`}
            >
              Aerial Satellite
            </button>
            <button
              onClick={() => setBasemapMode('osm')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                basemapMode === 'osm' ? 'bg-teal-500 text-slate-950 font-bold' : 'hover:bg-slate-800'
              }`}
            >
              OSM Streets
            </button>
          </div>

          {/* Aerial Opacity / Verification Tool (When satellite active) */}
          {basemapMode === 'satellite' && (
            <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-2.5 shadow-xl flex items-center gap-3 text-xs text-slate-300">
              <span className="text-slate-400 font-medium">Aerial Opacity:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={satelliteOpacity}
                onChange={(e) => setSatelliteOpacity(parseFloat(e.target.value))}
                className="w-24 accent-teal-400 cursor-pointer"
              />
              <span className="font-mono text-teal-400">{Math.round(satelliteOpacity * 100)}%</span>
            </div>
          )}

          {/* Layer Visibility Toggles */}
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-2.5 shadow-xl flex items-center gap-3 text-xs text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showRoads}
                onChange={(e) => setShowRoads(e.target.checked)}
                className="rounded accent-teal-500"
              />
              <span>Centerlines</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showNodes}
                onChange={(e) => setShowNodes(e.target.checked)}
                className="rounded accent-teal-500"
              />
              <span>Intersections</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showIssues}
                onChange={(e) => setShowIssues(e.target.checked)}
                className="rounded accent-rose-500"
              />
              <span className="text-rose-300 font-medium">Issue Markers</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showArrows}
                onChange={(e) => setShowArrows(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>One-Way</span>
            </label>
          </div>
        </div>

        {/* Aerial Inspection Pin Tool (Bottom-Left) */}
        <div className="absolute bottom-6 left-4 z-20">
          <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl p-3 shadow-xl max-w-sm text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span>Aerial Imagery Quality Pin</span>
              </div>
              <button
                onClick={() => setIsPinningMode(!isPinningMode)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  isPinningMode
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
                }`}
              >
                {isPinningMode ? 'Click Map to Place Pin' : '+ Add Discrepancy Pin'}
              </button>
            </div>
            {isPinningMode && (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Note (e.g. Centerline shifted 1.5m east of asphalt curb)"
                  value={discrepancyNote}
                  onChange={(e) => setDiscrepancyNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-teal-500 text-xs"
                />
                <p className="text-[10px] text-slate-400 italic">
                  Compare satellite imagery to vector lines and click anywhere on the road to record an aerial alignment audit finding.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Map Legend (Bottom-Right) */}
        <div className="absolute bottom-6 right-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-xl text-[11px] text-slate-300 space-y-1.5 pointer-events-none">
          <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-800">
            Road Class Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-[#f97316] rounded-sm" /> <span>Motorway (High Speed)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-[#fbbf24] rounded-sm" /> <span>Trunk / Ramp</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-[#14b8a6] rounded-sm" /> <span>Primary Arterial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-[#38bdf8] rounded-sm" /> <span>Secondary Collector</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-[#94a3b8] rounded-sm" /> <span>Residential Local</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-[#64748b] rounded-sm" /> <span>Service / Alley</span>
          </div>
        </div>
      </div>

      {/* Right Slide-Out Inspector Drawer */}
      {(selectedSegment || selectedIssue) && (
        <div className="w-84 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-20 shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-400" />
              <span>Feature Inspector</span>
            </h3>
            <button
              onClick={() => {
                setSelectedSegment(null);
                setSelectedIssue(null);
              }}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-800"
            >
              ✕ Close
            </button>
          </div>

          <div className="p-4 space-y-4 text-xs">
            {/* If an Issue is selected */}
            {selectedIssue && (
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    {selectedIssue.ruleCode} · {selectedIssue.severity}
                  </span>
                  <span className={`text-[10px] font-semibold ${selectedIssue.status === 'Resolved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedIssue.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-100 text-sm">{selectedIssue.title}</h4>
                <p className="text-slate-300 text-xs leading-relaxed">{selectedIssue.description}</p>
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                  <strong className="text-teal-300 block mb-0.5 font-medium">Suggested Corrective Action:</strong>
                  <span className="text-slate-300 text-[11px]">{selectedIssue.suggestedAction}</span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onUpdateIssueStatus(selectedIssue.id, 'Resolved', 'Resolved by Mapping QA Analyst')}
                    className="flex-1 py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded font-semibold text-center transition-colors"
                  >
                    ✓ Mark Resolved
                  </button>
                  <button
                    onClick={() => onUpdateIssueStatus(selectedIssue.id, 'False Positive', 'Verified as intentional geometry')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center transition-colors"
                  >
                    False Positive
                  </button>
                </div>
              </div>
            )}

            {/* If Segment is selected */}
            {selectedSegment && (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-teal-400 block">{selectedSegment.id}</span>
                  <h4 className="text-base font-bold text-white">{selectedSegment.name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Road Class</span>
                    <strong className="text-slate-200 capitalize">{selectedSegment.roadClass}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Length</span>
                    <strong className="text-slate-200 font-mono">{selectedSegment.lengthMeters.toFixed(1)} m</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Lanes</span>
                    <strong className="text-slate-200 font-mono">{selectedSegment.lanes}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Speed Limit</span>
                    <strong className={`font-mono ${selectedSegment.speedLimitKph > 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                      {selectedSegment.speedLimitKph > 0 ? `${selectedSegment.speedLimitKph} km/h` : 'MISSING'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Direction</span>
                    <strong className="text-slate-200">{selectedSegment.isOneWay ? 'One-Way' : 'Two-Way'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Surface</span>
                    <strong className="text-slate-200 capitalize">{selectedSegment.surface}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Traffic Control</span>
                    <strong className="text-slate-200 capitalize">{selectedSegment.trafficControl}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Lane Markings</span>
                    <strong className="text-slate-200">{selectedSegment.hasLaneMarkings ? 'Present' : 'None'}</strong>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium">Topology Endpoints:</div>
                  <div className="font-mono text-[10px] text-slate-300">
                    Start: Node {selectedSegment.startNodeId} [{selectedSegment.coordinates[0][0].toFixed(5)}, {selectedSegment.coordinates[0][1].toFixed(5)}]
                  </div>
                  <div className="font-mono text-[10px] text-slate-300">
                    End: Node {selectedSegment.endNodeId} [{selectedSegment.coordinates[selectedSegment.coordinates.length - 1][0].toFixed(5)}, {selectedSegment.coordinates[selectedSegment.coordinates.length - 1][1].toFixed(5)}]
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">SimForge AV Simulation Status:</span>
                  <div className="flex items-center gap-1.5">
                    {selectedSegment.avSimReady ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Simulation Ready
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Flagged for Review
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
