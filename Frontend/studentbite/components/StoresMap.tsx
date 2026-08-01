"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { IStore } from "@/lib/types";

interface Props {
  center: [number, number];
  stores: IStore[];
  radiusM: number;
  onMarkerClick?: (store: IStore) => void;
}

/**
 * Leaflet map showing nearby stores.
 * Must be loaded via next/dynamic with ssr: false.
 */
export default function StoresMap({
  center,
  stores,
  radiusM,
  onMarkerClick,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const circleRef = useRef<L.Circle | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center,
      zoom: 14,
      zoomControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    markersRef.current.addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center
  useEffect(() => {
    mapRef.current?.setView(center, mapRef.current.getZoom());
  }, [center]);

  // Update radius circle
  useEffect(() => {
    if (!mapRef.current) return;
    if (circleRef.current) {
      circleRef.current.setLatLng(center);
      circleRef.current.setRadius(radiusM);
    } else {
      circleRef.current = L.circle(center, {
        radius: radiusM,
        color: "#16a34a",
        weight: 1.5,
        fillColor: "#16a34a",
        fillOpacity: 0.08,
      }).addTo(mapRef.current);
    }
  }, [center, radiusM]);

  // Update markers
  useEffect(() => {
    markersRef.current.clearLayers();
    const storeIcon = L.divIcon({
      html: `<div style="background:#16a34a;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.3)">🛒</div>`,
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    for (const store of stores) {
      const marker = L.marker([store.lat, store.lng], { icon: storeIcon });
      marker.bindPopup(
        `<b>${store.name}</b><br/>${store.address ?? ""}<br/>${store.distanceM}m`,
      );
      if (onMarkerClick) {
        marker.on("click", () => onMarkerClick(store));
      }
      markersRef.current.addLayer(marker);
    }
  }, [stores, onMarkerClick]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-2xl"
      style={{ minHeight: 260 }}
    />
  );
}
