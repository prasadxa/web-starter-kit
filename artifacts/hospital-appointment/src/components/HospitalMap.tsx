import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

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
}

export default function HospitalMap({ hospitals, className }: HospitalMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const validHospitals = hospitals.filter(h => h.latitude && h.longitude);
    if (validHospitals.length === 0) return;

    const loadMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current!, {
        scrollWheelZoom: false,
      }).setView(
        [validHospitals[0].latitude!, validHospitals[0].longitude!],
        validHospitals.length === 1 ? 13 : 5
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      }).addTo(map);

      const icon = L.divIcon({
        html: `<div style="background:#3b82f6;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      validHospitals.forEach(h => {
        L.marker([h.latitude!, h.longitude!], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:180px">
              <strong>${h.name}</strong>
              <p style="margin:4px 0;font-size:12px;color:#666">${h.location}</p>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}" target="_blank" rel="noopener" style="color:#3b82f6;font-size:12px;text-decoration:none">Get Directions →</a>
            </div>
          `);
      });

      if (validHospitals.length > 1) {
        const bounds = L.latLngBounds(validHospitals.map(h => [h.latitude!, h.longitude!]));
        map.fitBounds(bounds, { padding: [40, 40] });
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
  }, [hospitals]);

  const validHospitals = hospitals.filter(h => h.latitude && h.longitude);

  if (validHospitals.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Hospital Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="h-[350px] rounded-lg overflow-hidden border" />
        <div className="mt-3 space-y-2">
          {validHospitals.map(h => (
            <div key={h.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{h.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                asChild
              >
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Directions
                </a>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
