import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, ExternalLink, Phone, Clock, LocateFixed } from "lucide-react";

interface Hospital {
  id: number;
  name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface HospitalMapProps {
  hospitals: Hospital[];
  className?: string;
  selectedHospitalId?: number | null;
  onSelectHospital?: (id: number | null) => void;
  showHospitalCards?: boolean;
  height?: string;
  userLocation?: { lat: number; lng: number } | null;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HospitalMap({ 
  hospitals, 
  className, 
  selectedHospitalId,
  onSelectHospital,
  showHospitalCards = true,
  height = "400px",
  userLocation
}: HospitalMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    const validHospitals = hospitals.filter(h => h.latitude && h.longitude);

    const loadMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Default to India center if no valid hospitals
      const initialCenter: [number, number] = validHospitals.length > 0 
        ? [validHospitals[0].latitude!, validHospitals[0].longitude!]
        : [20.5937, 78.9629]; // Coordinates for India
        
      const initialZoom = validHospitals.length > 0 
        ? (validHospitals.length === 1 ? 13 : 5)
        : 5;

      const map = L.map(mapRef.current!, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView(initialCenter, initialZoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      }).addTo(map);

      const createIcon = (isSelected: boolean) => L.divIcon({
        html: `<div style="background:${isSelected ? '#ef4444' : '#3b82f6'};width:${isSelected ? '34' : '28'}px;height:${isSelected ? '34' : '28'}px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:all 0.2s"><svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? '16' : '14'}" height="${isSelected ? '16' : '14'}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        className: "",
        iconSize: [isSelected ? 34 : 28, isSelected ? 34 : 28],
        iconAnchor: [isSelected ? 17 : 14, isSelected ? 34 : 28],
        popupAnchor: [0, isSelected ? -34 : -28],
      });

      markersRef.current = [];

      validHospitals.forEach(h => {
        const isSelected = selectedHospitalId === h.id;
        const marker = L.marker([h.latitude!, h.longitude!], { icon: createIcon(isSelected) })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:200px;font-family:system-ui">
              <strong style="font-size:14px">${h.name}</strong>
              <p style="margin:4px 0;font-size:12px;color:#666">${h.location}</p>
              ${userLocation ? `<p style="margin:4px 0;font-size:11px;color:#3b82f6;font-weight:600">${getDistanceKm(userLocation.lat, userLocation.lng, h.latitude!, h.longitude!).toFixed(1)} km away</p>` : ''}
              <div style="margin-top:8px;display:flex;gap:8px">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}" target="_blank" rel="noopener" style="color:white;background:#3b82f6;padding:4px 10px;border-radius:6px;font-size:11px;text-decoration:none;font-weight:600">Get Directions</a>
                <a href="https://www.google.com/maps/search/?api=1&query=${h.latitude},${h.longitude}" target="_blank" rel="noopener" style="color:#3b82f6;padding:4px 10px;border-radius:6px;font-size:11px;text-decoration:none;border:1px solid #3b82f6;font-weight:600">View on Map</a>
              </div>
            </div>
          `);

        if (onSelectHospital) {
          marker.on('click', () => onSelectHospital(h.id));
        }

        if (isSelected) {
          marker.openPopup();
        }

        markersRef.current.push({ marker, hospitalId: h.id });
      });

      if (userLocation) {
        const userIcon = L.divIcon({
          html: `<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(34,197,94,0.3),0 2px 8px rgba(0,0,0,0.2)"></div>`,
          className: "",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<div style="font-family:system-ui"><strong>Your Location</strong></div>');
      }

      if (selectedHospitalId) {
        const selected = validHospitals.find(h => h.id === selectedHospitalId);
        if (selected) {
          map.setView([selected.latitude!, selected.longitude!], 14);
        }
      } else if (validHospitals.length > 1) {
        const allPoints = validHospitals.map(h => [h.latitude!, h.longitude!] as [number, number]);
        if (userLocation) {
          allPoints.push([userLocation.lat, userLocation.lng]);
        }
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      mapInstanceRef.current = map;
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hospitals, selectedHospitalId, userLocation]);

  const validHospitals = hospitals.filter(h => h.latitude && h.longitude);

  if (validHospitals.length === 0) {
    return null;
  }

  const hospitalsWithDistance = validHospitals.map(h => ({
    ...h,
    distance: userLocation 
      ? getDistanceKm(userLocation.lat, userLocation.lng, h.latitude!, h.longitude!)
      : null
  })).sort((a, b) => {
    if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
    return 0;
  });

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Hospital Locations</h3>
        </div>
        {userLocation && (
          <Badge variant="secondary" className="gap-1">
            <LocateFixed className="h-3 w-3" />
            Location enabled
          </Badge>
        )}
      </div>
      
      <div ref={mapRef} className="rounded-2xl overflow-hidden border border-border/60 shadow-sm" style={{ height }} />
      
      {showHospitalCards && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hospitalsWithDistance.map(h => (
            <Card 
              key={h.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${selectedHospitalId === h.id ? 'ring-2 ring-primary shadow-md' : ''}`}
              onClick={() => onSelectHospital?.(selectedHospitalId === h.id ? null : h.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{h.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{h.location}</p>
                    {h.distance !== null && (
                      <p className="text-xs font-semibold text-primary mt-1">{h.distance.toFixed(1)} km away</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    asChild
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Get Directions"
                    >
                      <Navigation className="h-4 w-4 text-primary" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export { getDistanceKm };
