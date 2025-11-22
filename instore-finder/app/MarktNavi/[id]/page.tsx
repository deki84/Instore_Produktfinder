"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import mapImage from '../../assets/map.jpg'; 
import { Search, Plus, Minus, MapPin, Navigation, Menu, X, ChevronRight, Compass, Target, Check, Footprints } from 'lucide-react';

// --- DEINE NEUEN DATEN ---
// Pixel-Koordinaten werden unten dynamisch in % umgerechnet
const PRODUCT_DATA = [
  { "aisle": "1", "category": "Sanitär und Keramik", "coordinates": { "x": 1220, "y": 670 } },
  { "aisle": "2", "category": "Sanitär und Keramik", "coordinates": { "x": 1220, "y": 670 } },
  { "aisle": "3", "category": "Baddeko", "coordinates": { "x": 1300, "y": 670 } },
  { "aisle": "4", "category": "Baddeko", "coordinates": { "x": 1300, "y": 670 } },
  { "aisle": "5", "category": "Baddeko", "coordinates": { "x": 1300, "y": 670 } },
  { "aisle": "6", "category": "Sanitär Installation", "coordinates": { "x": 1380, "y": 670 } },
  { "aisle": "7", "category": "Sanitär Installation", "coordinates": { "x": 1380, "y": 670 } },
  { "aisle": "8", "category": "Heizung", "coordinates": { "x": 1460, "y": 670 } },
  { "aisle": "9", "category": "Heizung", "coordinates": { "x": 1460, "y": 670 } },
  { "aisle": "10", "category": "Isolierung / Dämmung", "coordinates": { "x": 1540, "y": 670 } },
  { "aisle": "11", "category": "Isolierung / Dämmung", "coordinates": { "x": 1540, "y": 670 } },
  { "aisle": "13", "category": "Mörtel / Putz / Zement", "coordinates": { "x": 1620, "y": 800 } },
  { "aisle": "14", "category": "Bauholz", "coordinates": { "x": 1590, "y": 550 } },
  { "aisle": "15", "category": "Arbeitsplatten / Holz", "coordinates": { "x": 1540, "y": 550 } },
  { "aisle": "16", "category": "Möbelbau / Holz", "coordinates": { "x": 1500, "y": 550 } },
  { "aisle": "17", "category": "Möbelbau / Holz", "coordinates": { "x": 1500, "y": 550 } },
  { "aisle": "18", "category": "Bauelemente", "coordinates": { "x": 1420, "y": 550 } },
  { "aisle": "19", "category": "Bauelemente", "coordinates": { "x": 1420, "y": 550 } },
  { "aisle": "20", "category": "Bauelemente", "coordinates": { "x": 1420, "y": 550 } },
  { "aisle": "21", "category": "Parkett / Laminat", "coordinates": { "x": 1300, "y": 550 } },
  { "aisle": "23", "category": "Parkett / Laminat", "coordinates": { "x": 1300, "y": 550 } },
  { "aisle": "24", "category": "Fliesen", "coordinates": { "x": 1190, "y": 550 } },
  { "aisle": "25", "category": "Fliesen", "coordinates": { "x": 1190, "y": 550 } },
  { "aisle": "26", "category": "Fliesenzubehör", "coordinates": { "x": 1120, "y": 550 } },
  { "aisle": "27", "category": "Maschinen", "coordinates": { "x": 1050, "y": 550 } },
  { "aisle": "28", "category": "Maschinen", "coordinates": { "x": 1050, "y": 550 } },
  { "aisle": "29", "category": "Maschinen", "coordinates": { "x": 1050, "y": 550 } },
  { "aisle": "30", "category": "Auto", "coordinates": { "x": 1000, "y": 550 } },
  { "aisle": "31", "category": "Werkzeuge", "coordinates": { "x": 1050, "y": 550 } },
  { "aisle": "32", "category": "Eisenwaren", "coordinates": { "x": 980, "y": 550 } },
  { "aisle": "33", "category": "Eisenwaren", "coordinates": { "x": 980, "y": 550 } },
  { "aisle": "34", "category": "Eisenwaren", "coordinates": { "x": 980, "y": 550 } },
  { "aisle": "35", "category": "Ordnung", "coordinates": { "x": 900, "y": 550 } },
  { "aisle": "36", "category": "Ordnung", "coordinates": { "x": 900, "y": 550 } },
  { "aisle": "37", "category": "Haushalt", "coordinates": { "x": 815, "y": 550 } },
  { "aisle": "38", "category": "Farben und Lacke", "coordinates": { "x": 750, "y": 550 } },
  { "aisle": "39", "category": "Farben und Lacke", "coordinates": { "x": 750, "y": 550 } },
  { "aisle": "40", "category": "Farben und Lacke", "coordinates": { "x": 750, "y": 550 } },
  { "aisle": "41", "category": "Farben und Lacke", "coordinates": { "x": 750, "y": 550 } },
  { "aisle": "42", "category": "Tapeten", "coordinates": { "x": 700, "y": 700 } },
  { "aisle": "43", "category": "Innendeko", "coordinates": { "x": 760, "y": 700 } },
  { "aisle": "44", "category": "Innendeko", "coordinates": { "x": 760, "y": 700 } },
  { "aisle": "45", "category": "Innendeko", "coordinates": { "x": 760, "y": 700 } },
  { "aisle": "46", "category": "Elektro", "coordinates": { "x": 820, "y": 700 } },
  { "aisle": "47", "category": "Elektro", "coordinates": { "x": 820, "y": 700 } },
  { "aisle": "48", "category": "Leuchten", "coordinates": { "x": 900, "y": 700 } },
  { "aisle": "49", "category": "Leuchten", "coordinates": { "x": 900, "y": 700 } },
  { "aisle": "50", "category": "Leuchten", "coordinates": { "x": 900, "y": 700 } },
  { "aisle": "51", "category": "Leuchten", "coordinates": { "x": 900, "y": 700 } },
  { "aisle": "52", "category": "Leuchten", "coordinates": { "x": 900, "y": 700 } }
];

// --- KONSTANTEN FÜR UMRCHUNG ---
const MAP_WIDTH = 1920; 
const MAP_HEIGHT = 1080;

// --- DATENTYPEN ---

interface Point {
  x: number;
  y: number;
}

interface GraphNode {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
}

// --- A* GRAPH DEFINITION ---
const WAYPOINT_GRAPH: GraphNode[] = [
  // 1. EINGANGSBEREICH (Vertikale Achse)
  { id: 'entry_hall', x: 55, y: 82, neighbors: ['main_corridor_center'] },
  
  // Haupt-Verteiler in der Mitte (Y=72)
  { id: 'main_corridor_center', x: 55, y: 72, neighbors: ['entry_hall', 'aisle_paint_mid'] },

  // 2. HORIZONTALE HAUPTACHSE (Y=59)
  { id: 'garden_back', x: 15, y: 51, neighbors: ['garden_entry'] },
  { id: 'garden_entry', x: 25, y: 51, neighbors: ['garden_back', 'garden_center'] },
  { id: 'garden_center', x: 25, y: 59, neighbors: ['garden_entry', 'aisle_paint_back'] },

  { id: 'aisle_paint_back', x: 32, y: 59, neighbors: ['garden_center', 'aisle_tools_entry'] },
  { id: 'aisle_tools_entry', x: 39, y: 59, neighbors: ['aisle_paint_back', 'aisle_tools_back'] },
  { id: 'aisle_tools_back', x: 45, y: 59, neighbors: ['aisle_tools_entry', 'aisle_tools_mid'] },
  { id: 'aisle_tools_mid', x: 50, y: 59, neighbors: ['aisle_tools_back', 'aisle_paint_mid'] },

  // ZENTRUM (Kreuzungspunkt Y=59 / X=55)
  { id: 'aisle_paint_mid', x: 55, y: 59, neighbors: ['aisle_tools_mid', 'main_corridor_center', 'main_corridor_sanitary'] },

  // Rechter Flügel
  { id: 'main_corridor_sanitary', x: 63, y: 59, neighbors: ['aisle_paint_mid', 'wood_center'] },
  { id: 'wood_center', x: 70, y: 59, neighbors: ['main_corridor_sanitary', 'wood_back'] },
  { id: 'wood_back', x: 75, y: 59, neighbors: ['wood_center', 'wood_entry'] },
  { id: 'wood_entry', x: 80, y: 59, neighbors: ['wood_back'] },
];

// --- HELPER FUNCTIONS ---
const getDistance = (a: Point, b: Point) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

const findNearestNode = (point: Point, graph: GraphNode[]): GraphNode => {
  let nearest = graph[0];
  let minDist = Infinity;
  graph.forEach(node => {
    const dist = getDistance(point, { x: node.x, y: node.y });
    if (dist < minDist) {
      minDist = dist;
      nearest = node;
    }
  });
  return nearest;
};

const findPathAStar = (startPos: Point, endPos: Point, graph: GraphNode[]): Point[] => {
  const startNode = findNearestNode(startPos, graph);
  const endNode = findNearestNode(endPos, graph);

  if (startNode.id === endNode.id) return [startPos, endPos];

  const openSet: string[] = [startNode.id];
  const cameFrom: Record<string, string> = {};
  
  const gScore: Record<string, number> = {};
  graph.forEach(n => gScore[n.id] = Infinity);
  gScore[startNode.id] = 0;

  const fScore: Record<string, number> = {};
  graph.forEach(n => fScore[n.id] = Infinity);
  fScore[startNode.id] = getDistance(startNode, endNode);

  while (openSet.length > 0) {
    let currentId = openSet.reduce((lowest, id) => (fScore[id] < fScore[lowest] ? id : lowest), openSet[0]);

    if (currentId === endNode.id) {
      const path: Point[] = [];
      let curr = currentId;
      while (curr in cameFrom) {
        const node = graph.find(n => n.id === curr)!;
        path.unshift({ x: node.x, y: node.y });
        curr = cameFrom[curr];
      }
      const firstNode = graph.find(n => n.id === startNode.id)!;
      path.unshift({ x: firstNode.x, y: firstNode.y });
      return [startPos, ...path, endPos];
    }

    openSet.splice(openSet.indexOf(currentId), 1);
    const currentNode = graph.find(n => n.id === currentId)!;

    currentNode.neighbors.forEach(neighborId => {
      const neighbor = graph.find(n => n.id === neighborId);
      if(!neighbor) return; 
      const tentativeGScore = gScore[currentId] + getDistance(currentNode, neighbor);
      if (tentativeGScore < gScore[neighborId]) {
        cameFrom[neighborId] = currentId;
        gScore[neighborId] = tentativeGScore;
        fScore[neighborId] = gScore[neighborId] + getDistance(neighbor, endNode);
        if (!openSet.includes(neighborId)) openSet.push(neighborId);
      }
    });
  }
  return [startPos, endPos]; 
};

const DEFAULT_START = { x: 54, y: 92 }; 

export default function MarktNaviPage() {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [userLocation, setUserLocation] = useState<{x: number, y: number} | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [clickStartTime, setClickStartTime] = useState(0);

  const [heading, setHeading] = useState(0);
  const [compassActive, setCompassActive] = useState(false);

  const [activePath, setActivePath] = useState<Point[] | null>(null);
  const [destination, setDestination] = useState<any | null>(null); // any weil wir jetzt raw objects nutzen

  const containerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // Helper für normalisierte Koordinaten (%)
  const getNormalizedPoint = (coords: {x: number, y: number}) => ({
    x: (coords.x / MAP_WIDTH) * 100,
    y: (coords.y / MAP_HEIGHT) * 100
  });

  const startNavigation = (product: any) => {
    const start = userLocation || DEFAULT_START;
    const end = getNormalizedPoint(product.coordinates);
    
    const path = findPathAStar(start, end, WAYPOINT_GRAPH);
    setActivePath(path);
    setDestination(product);
    setSidebarOpen(false);
  };

  const stopNavigation = () => {
    setActivePath(null);
    setDestination(null);
  };

  useEffect(() => {
    return () => { window.removeEventListener('deviceorientation', handleOrientation); };
  }, []);

  const handleOrientation = (e: DeviceOrientationEvent) => {
    let compass = 0;
    if ((e as any).webkitCompassHeading) compass = (e as any).webkitCompassHeading;
    else if (e.alpha !== null) compass = 360 - e.alpha;
    setHeading(Math.round(compass));
  };

  const toggleCompass = async () => {
     if (!compassActive) {
       if (typeof DeviceOrientationEvent !== 'undefined' && (DeviceOrientationEvent as any).requestPermission) {
          try {
            const resp = await (DeviceOrientationEvent as any).requestPermission();
            if (resp === 'granted') { setCompassActive(true); window.addEventListener('deviceorientation', handleOrientation); }
          } catch (e) { console.error(e); }
       } else {
          setCompassActive(true); window.addEventListener('deviceorientation', handleOrientation);
       }
     } else {
         setCompassActive(false); setHeading(0); window.removeEventListener('deviceorientation', handleOrientation);
     }
  };

  const handleZoom = (delta: number) => setScale(prev => Math.min(Math.max(prev + delta, 1), 4));

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    setClickStartTime(Date.now());
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    const duration = Date.now() - clickStartTime;
    if (duration < 200 && isSelectingLocation && mapWrapperRef.current) {
      handleMapClick(e);
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!mapWrapperRef.current) return;
    const target = e.currentTarget as HTMLDivElement;
    const clickRect = target.getBoundingClientRect();
    const percentX = ((e.clientX - clickRect.left) / clickRect.width) * 100;
    const percentY = ((e.clientY - clickRect.top) / clickRect.height) * 100;
    
    setUserLocation({ x: percentX, y: percentY });
    if (destination) {
        // Recalculate Path
        const end = getNormalizedPoint(destination.coordinates);
        const newPath = findPathAStar({ x: percentX, y: percentY }, end, WAYPOINT_GRAPH);
        setActivePath(newPath);
    }
  };

  const filteredData = PRODUCT_DATA.filter(item => 
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.aisle.includes(searchQuery)
  );

  const pathString = useMemo(() => {
    if (!activePath || activePath.length < 2) return "";
    return activePath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [activePath]);

  return (
    <div className="relative w-full h-screen bg-zinc-900 overflow-hidden font-sans text-zinc-800 dark:text-zinc-100">
      
      {/* Navigation Overlay */}
      {destination && !isSelectingLocation && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-white/90 dark:bg-zinc-800/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border-2 border-orange-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <div className="text-sm">
                <span className="text-zinc-500">Ziel: </span>
                <span className="font-bold text-orange-600">{destination.category} (Gang {destination.aisle})</span>
            </div>
            <button onClick={stopNavigation} className="p-1 bg-zinc-200 dark:bg-zinc-700 rounded-full hover:bg-zinc-300">
                <X size={14} />
            </button>
        </div>
      )}

      {/* Location Selection Overlay */}
      {isSelectingLocation && (
        <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-orange-500 text-white shadow-lg animate-in slide-in-from-top">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="animate-pulse" />
              <span className="font-medium">Tippe auf deinen Standort</span>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setIsSelectingLocation(false)} className="px-3 py-1.5 bg-orange-600 rounded-lg text-sm hover:bg-orange-700">Abbrechen</button>
               {userLocation && (
                <button onClick={() => setIsSelectingLocation(false)} className="px-3 py-1.5 bg-white text-orange-600 font-bold rounded-lg text-sm flex items-center gap-1"><Check size={16} /> Fertig</button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Map Area */}
      <div 
        ref={containerRef}
        className={`w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 transition-colors duration-300 ${isSelectingLocation ? 'cursor-crosshair' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        onWheel={(e) => handleZoom(e.deltaY > 0 ? -0.1 : 0.1)}
      >
        <div 
          ref={mapWrapperRef}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${-heading}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
          className="relative w-full h-full max-w-[1920px] max-h-[1080px] origin-center will-change-transform" 
        >
          <Image src={mapImage} alt="Markt Plan" fill quality={100} priority className="object-contain select-none pointer-events-none" draggable={false} />

          {/* Route SVG Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
                <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                    <polygon points="0 0, 4 2, 0 4" fill="#f97316" />
                </marker>
                <marker id="startdot" markerWidth="4" markerHeight="4" refX="2" refY="2">
                    <circle cx="2" cy="2" r="2" fill="#f97316" />
                </marker>
            </defs>
            
            {activePath && (
                <>
                    <path d={pathString} fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                    <path 
                        d={pathString} 
                        fill="none" 
                        stroke="#f97316" 
                        strokeWidth="0.8" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        strokeDasharray="2,1" 
                        markerEnd="url(#arrowhead)"
                        markerStart="url(#startdot)"
                        className="animate-dash" 
                    />
                </>
            )}
          </svg>

          {/* --- HIER SIND DIE GRÜNEN PUNKTE --- */}
          {/* Loop über PRODUCT_DATA mit Umrechnung der Koordinaten */}
          {PRODUCT_DATA.map((product, index) => (
            <div 
              key={index}
              className="absolute z-30 w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm pointer-events-none hover:bg-green-400 transition-colors"
              style={{ 
                // Umrechnung von Pixel (z.B. 1220) in Prozent relativ zum Bildcontainer
                left: `${(product.coordinates.x / MAP_WIDTH) * 100}%`, 
                top: `${(product.coordinates.y / MAP_HEIGHT) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
              title={`${product.category} (Gang ${product.aisle})`}
            />
          ))}

          {/* Debug Nodes (Rot) - optional */}
          {WAYPOINT_GRAPH.map((node) => (
            <div 
              key={node.id} 
              className="absolute z-40 w-2 h-2 bg-red-600 rounded-full border border-white shadow-sm pointer-events-none opacity-50"
              style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
            />
          ))}

          {/* Pins */}
          {userLocation && (
            <div className="absolute z-20 transform -translate-x-1/2 -translate-y-full drop-shadow-xl" style={{ left: `${userLocation.x}%`, top: `${userLocation.y}%` }}>
              <div className="relative">
                <MapPin size={48} className="text-orange-600 fill-orange-600 animate-bounce" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-black/30 blur-sm rounded-full"></div>
              </div>
            </div>
          )}
          
          {destination && (
            <div className="absolute z-20 transform -translate-x-1/2 -translate-y-full drop-shadow-xl" 
                style={{ 
                    left: `${(destination.coordinates.x / MAP_WIDTH) * 100}%`, 
                    top: `${(destination.coordinates.y / MAP_HEIGHT) * 100}%` 
                }}>
                <MapPin size={48} className="text-blue-600 fill-blue-600" />
                <span className="absolute top-full left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded shadow mt-1 whitespace-nowrap">
                    {destination.category}
                </span>
            </div>
          )}

        </div>
      </div>

      {/* UI Controls */}
      {!isSelectingLocation && (
        <>
            <div className="absolute top-0 left-0 right-0 p-4 z-10 pointer-events-none">
                <div className="max-w-2xl mx-auto flex gap-3 pointer-events-auto">
                    <button onClick={() => setSidebarOpen(true)} className="p-3 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-lg rounded-full text-zinc-700 dark:text-zinc-200 hover:bg-white transition-all"><Menu size={24} /></button>
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Search size={20} className="text-zinc-400" /></div>
                        <input type="text" placeholder="Gang oder Produkt suchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full py-3 pl-10 pr-4 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-lg rounded-full border-none outline-none focus:ring-2 focus:ring-orange-500 text-zinc-800 dark:text-zinc-100 transition-all" />
                    </div>
                </div>
                <div className="max-w-2xl mx-auto mt-2 flex justify-end pointer-events-auto">
                    <button onClick={() => setIsSelectingLocation(true)} className="flex items-center gap-2 bg-black/60 backdrop-blur text-white px-3 py-1 rounded-full text-xs hover:bg-black/80 transition-colors">
                        <Target size={12} /> {userLocation ? "Standort ändern" : "Standort: Eingang"}
                    </button>
                </div>
            </div>

            <div className="absolute bottom-8 right-6 z-10 flex flex-col gap-3 pointer-events-auto">
                <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-xl rounded-2xl p-1.5 flex flex-col gap-1">
                    <button onClick={() => handleZoom(0.5)} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl"><Plus size={24} /></button>
                    <div className="h-[1px] w-full bg-zinc-200 dark:bg-zinc-700 mx-auto" />
                    <button onClick={() => handleZoom(-0.5)} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl"><Minus size={24} /></button>
                </div>
                <button onClick={toggleCompass} className={`p-4 shadow-xl rounded-2xl flex items-center justify-center ${compassActive ? 'bg-blue-600 text-white' : 'bg-white/90 dark:bg-zinc-800/90 text-zinc-700'}`}><Compass size={24} /></button>
                <button onClick={() => { setScale(1); setPosition({x:0, y:0}); setHeading(0); }} className="p-4 bg-orange-500 text-white shadow-xl rounded-2xl hover:bg-orange-600"><Navigation size={24} /></button>
            </div>
        </>
      )}

      {/* Sidebar */}
      <div className={`absolute inset-y-0 left-0 w-full sm:w-96 bg-white dark:bg-zinc-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <div><h2 className="text-xl font-bold text-zinc-900 dark:text-white">Markt Übersicht</h2><p className="text-sm text-zinc-500">Wetzlar</p></div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredData.map((item, index) => (
                  <div key={index} onClick={() => startNavigation(item)} className="flex items-center justify-between p-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent hover:border-orange-200 dark:hover:border-orange-900 transition-all group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 text-zinc-600 flex items-center justify-center group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors"><Footprints size={20} /></div>
                      <div><h3 className="font-medium text-zinc-800 dark:text-zinc-200">{item.category}</h3><p className="text-xs text-zinc-500">Gang {item.aisle}</p></div>
                    </div>
                    <ChevronRight size={18} className="text-zinc-300 group-hover:text-orange-500 transition-colors" />
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </div>
  );
}