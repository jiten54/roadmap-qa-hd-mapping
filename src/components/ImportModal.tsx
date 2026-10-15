import React, { useState } from 'react';
import { RoadSegment, IntersectionNode } from '../types/gis';
import { calculatePolylineLength } from '../utils/geoMath';
import {
  UploadCloud,
  FileCheck,
  AlertTriangle,
  X,
  FileText,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (datasetName: string, segments: RoadSegment[], nodes: IntersectionNode[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [importFormat, setImportFormat] = useState<'geojson' | 'csv' | 'shapefile'>('geojson');
  const [rawText, setRawText] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [parsedPreview, setParsedPreview] = useState<{
    segmentCount: number;
    crsDetected: string;
    sampleSegmentName?: string;
  } | null>(null);

  if (!isOpen) return null;

  // Pre-fill a sample custom GeoJSON for convenience
  const loadSampleGeoJson = () => {
    const sample = {
      type: "FeatureCollection",
      name: "Custom_Proving_Track_Import",
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
      },
      features: [
        {
          type: "Feature",
          id: "IMP_SEG_01",
          properties: {
            name: "Autonomous Test Oval - North Curve",
            roadClass: "primary",
            lanes: 2,
            speedLimitKph: 60,
            isOneWay: true,
            surface: "asphalt"
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [-122.3980, 37.7900],
              [-122.3950, 37.7905],
              [-122.3920, 37.7900]
            ]
          }
        },
        {
          type: "Feature",
          id: "IMP_SEG_02",
          properties: {
            name: "Autonomous Test Oval - South Return",
            roadClass: "primary",
            lanes: 2,
            speedLimitKph: 60,
            isOneWay: true,
            surface: "asphalt"
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [-122.3920, 37.7900],
              [-122.3950, 37.7895],
              [-122.3980, 37.7900]
            ]
          }
        }
      ]
    };
    setRawText(JSON.stringify(sample, null, 2));
    validateData(JSON.stringify(sample, null, 2));
  };

  const validateData = (content: string) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!content.trim()) {
      setValidationErrors(['Input data is empty. Please paste GeoJSON or CSV data.']);
      setParsedPreview(null);
      return;
    }

    try {
      if (importFormat === 'geojson') {
        const parsed = JSON.parse(content);
        if (parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
          errors.push('Invalid GeoJSON: Root must be a FeatureCollection containing a "features" array.');
        } else {
          const ids = new Set<string>();
          let validCount = 0;

          parsed.features.forEach((feat: any, idx: number) => {
            const featId = feat.id || feat.properties?.id || `SEG_${idx + 1}`;
            if (ids.has(featId)) {
              warnings.push(`Duplicate Feature ID detected: "${featId}". IDs must be unique.`);
            }
            ids.add(featId);

            if (!feat.geometry) {
              errors.push(`Record ${idx + 1} (${featId}): Missing geometry object.`);
            } else if (feat.geometry.type !== 'LineString') {
              warnings.push(`Record ${idx + 1} (${featId}): Geometry type is "${feat.geometry.type}" (Expected "LineString" for centerlines).`);
            } else {
              const coords = feat.geometry.coordinates;
              if (!Array.isArray(coords) || coords.length < 2) {
                errors.push(`Record ${idx + 1} (${featId}): Insufficient vertices for LineString (< 2 coordinates).`);
              } else {
                for (const c of coords) {
                  if (typeof c[0] !== 'number' || typeof c[1] !== 'number' || isNaN(c[0]) || isNaN(c[1])) {
                    errors.push(`Record ${idx + 1} (${featId}): Invalid coordinate coordinates [${c[0]}, ${c[1]}].`);
                    break;
                  }
                  if (c[0] < -180 || c[0] > 180 || c[1] < -90 || c[1] > 90) {
                    errors.push(`Record ${idx + 1} (${featId}): Coordinates [${c[0]}, ${c[1]}] exceed WGS84 EPSG:4326 limits [-180, 180], [-90, 90].`);
                    break;
                  }
                }
              }
            }

            if (!feat.properties?.speedLimitKph && !feat.properties?.maxspeed) {
              warnings.push(`Record ${idx + 1} (${featId}): Missing speed limit attribute.`);
            }

            validCount++;
          });

          setParsedPreview({
            segmentCount: validCount,
            crsDetected: parsed.crs?.properties?.name || 'EPSG:4326 (Default WGS84)',
            sampleSegmentName: parsed.features[0]?.properties?.name || 'Unnamed Road'
          });
        }
      }
    } catch (e: any) {
      errors.push(`JSON Syntax Error: ${e.message}`);
      setParsedPreview(null);
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);
  };

  const handleImport = () => {
    if (validationErrors.length > 0 || !parsedPreview) return;

    try {
      const parsed = JSON.parse(rawText);
      const newSegments: RoadSegment[] = [];
      const nodeMap = new Map<string, [number, number]>();

      parsed.features.forEach((feat: any, idx: number) => {
        const id = feat.id || feat.properties?.id || `IMP_SEG_${String(idx + 1).padStart(2, '0')}`;
        const coords = feat.geometry.coordinates as [number, number][];
        const startCoord = coords[0];
        const endCoord = coords[coords.length - 1];

        const startNodeId = `NODE_IMP_${idx * 2 + 1}`;
        const endNodeId = `NODE_IMP_${idx * 2 + 2}`;

        nodeMap.set(startNodeId, startCoord);
        nodeMap.set(endNodeId, endCoord);

        newSegments.push({
          id,
          name: feat.properties?.name || `Imported Segment ${idx + 1}`,
          roadClass: feat.properties?.roadClass || 'primary',
          coordinates: coords,
          lengthMeters: Math.round(calculatePolylineLength(coords) * 10) / 10,
          lanes: feat.properties?.lanes || 2,
          speedLimitKph: feat.properties?.speedLimitKph || 50,
          isOneWay: !!feat.properties?.isOneWay,
          surface: feat.properties?.surface || 'asphalt',
          hasSidewalk: !!feat.properties?.hasSidewalk,
          hasBicycleLane: !!feat.properties?.hasBicycleLane,
          trafficControl: feat.properties?.trafficControl || 'signals',
          hasLaneMarkings: feat.properties?.hasLaneMarkings !== false,
          startNodeId,
          endNodeId,
          avSimReady: true
        });
      });

      const newNodes: IntersectionNode[] = Array.from(nodeMap.entries()).map(([nodeId, coords]) => ({
        id: nodeId,
        coordinates: coords,
        connectedSegmentIds: newSegments.filter(s => s.startNodeId === nodeId || s.endNodeId === nodeId).map(s => s.id),
        degree: 2,
        type: 'standard_intersection',
        trafficControl: 'signals'
      }));

      onImportSuccess(parsed.name || 'Imported GIS Dataset', newSegments, newNodes);
      onClose();
    } catch (e: any) {
      setValidationErrors([`Failed to process imported features: ${e.message}`]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Import Geospatial Road Network</h3>
              <p className="text-[11px] text-slate-400">
                Supports GeoJSON, Shapefile schema, and CSV coordinate centerlines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Format selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportFormat('geojson')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  importFormat === 'geojson' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                GeoJSON (.geojson)
              </button>
              <button
                onClick={() => setImportFormat('shapefile')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  importFormat === 'shapefile' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Shapefile (.shp / .dbf / .shx)
              </button>
              <button
                onClick={() => setImportFormat('csv')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  importFormat === 'csv' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Coordinates CSV
              </button>
            </div>

            <button
              onClick={loadSampleGeoJson}
              className="text-teal-400 hover:text-teal-300 font-semibold text-[11px] underline"
            >
              Load Sample GeoJSON Template
            </button>
          </div>

          {/* Textarea */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Data Payload (Paste Text or JSON)
            </label>
            <textarea
              rows={8}
              placeholder="Paste raw GeoJSON FeatureCollection or coordinate table here..."
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                validateData(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Structural Validation Feedback */}
          {parsedPreview && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Structural Structure Validated</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Detected: {parsedPreview.segmentCount} segments · CRS: {parsedPreview.crsDetected}
              </div>
            </div>
          )}

          {/* Errors list */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Import Validation Errors ({validationErrors.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-rose-300 text-[11px]">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings list */}
          {validationWarnings.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <HelpCircle className="w-4 h-4" />
                <span>Non-Fatal Discrepancy Warnings ({validationWarnings.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-300 text-[11px]">
                {validationWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={validationErrors.length > 0 || !parsedPreview}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-40 rounded-lg transition-colors shadow-sm"
          >
            Load into RoadMap QA
          </button>
        </div>
      </div>
    </div>
  );
};
