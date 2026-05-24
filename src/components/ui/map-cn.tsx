import { useEffect, useRef, useState } from "react";

// Load Leaflet dynamically from CDN to avoid npm dependency bundling errors
const loadLeaflet = () => {
  return new Promise<void>((resolve, reject) => {
    if ((window as any).L) {
      resolve();
      return;
    }
    
    // Add Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // Add Leaflet Script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.crossOrigin = "";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet script failed to load"));
    document.head.appendChild(script);
  });
};

interface LiveMapProps {
  userCoords?: [number, number];
  className?: string;
}

export function Map({ userCoords, className = "h-[300px] w-full rounded-2xl" }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>(userCoords || [12.9716, 77.5946]); // Bangalore default

  useEffect(() => {
    loadLeaflet()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((e) => console.error("Leaflet loader error:", e));
  }, []);

  // Update center when coords change
  useEffect(() => {
    if (userCoords) {
      setCurrentCoords(userCoords);
    }
  }, [userCoords]);

  // Request user GPS location if not provided
  useEffect(() => {
    if (navigator.geolocation && !userCoords) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentCoords([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.warn("GPS access denied, defaulting map center", error);
        }
      );
    }
  }, [userCoords]);

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current) return;
    
    // Clean up previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const L = (window as any).L;
    if (!L) return;

    // Create Map centered at user's current GPS coordinates
    const map = L.map(mapContainerRef.current).setView(currentCoords, 14);
    mapInstanceRef.current = map;

    // OpenStreetMap free tile server
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Custom CSS icons for markers
    const carIcon = L.divIcon({
      className: 'bg-indigo-600 border-4 border-white h-7 w-7 rounded-full shadow-2xl flex items-center justify-center text-white text-xs font-bold ring-4 ring-indigo-500/30 animate-pulse',
      html: '🚗',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const restIcon = L.divIcon({
      className: 'bg-emerald-600 border-2 border-white h-6 w-6 rounded-full shadow-lg flex items-center justify-center text-white text-xs font-bold',
      html: '☕',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const motelIcon = L.divIcon({
      className: 'bg-blue-600 border-2 border-white h-6 w-6 rounded-full shadow-lg flex items-center justify-center text-white text-xs font-bold',
      html: '🏨',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Add marker for driver's current position
    L.marker(currentCoords, { icon: carIcon })
      .addTo(map)
      .bindPopup("<b>My Vehicle</b><br/>GPS tracking active.")
      .openPopup();

    // Mock 3 nearby rest areas based on driver location
    const restStops = [
      { name: "Coffee Shop & Rest Stop", coords: [currentCoords[0] + 0.005, currentCoords[1] + 0.003], icon: restIcon, desc: "0.4 miles away - Open 24/7" },
      { name: "Highway Service Station", coords: [currentCoords[0] - 0.006, currentCoords[1] - 0.008], icon: restIcon, desc: "0.8 miles away - Free parking" },
      { name: "Drive-In Motel & Lounge", coords: [currentCoords[0] + 0.008, currentCoords[1] - 0.004], icon: motelIcon, desc: "1.2 miles away - Rooms available" },
    ];

    restStops.forEach(stop => {
      L.marker(stop.coords, { icon: stop.icon })
        .addTo(map)
        .bindPopup(`<b>${stop.name}</b><br/>${stop.desc}<br/><a href='https://www.google.com/maps/dir/?api=1&destination=${stop.coords[0]},${stop.coords[1]}' target='_blank' style='color:#3b82f6;font-weight:bold;text-decoration:underline;'>Directions</a>`);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded, currentCoords]);

  return (
    <div className="relative border border-border/30 rounded-2xl overflow-hidden shadow-md">
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center backdrop-blur-sm z-10">
          <div className="text-center space-y-2">
            <span className="text-sm font-semibold">Loading Live Maps...</span>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className={className} />
    </div>
  );
}

export function MapTitle({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}