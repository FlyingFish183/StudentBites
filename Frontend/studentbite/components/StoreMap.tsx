"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

import { STORE_TYPE_LABELS, type IStore } from "@/lib/types";

interface IProps {
  center: { lat: number; lng: number };
  radius: number;
  stores: IStore[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

/**
 * Ghim vẽ tay: ô vuông sơn có viền đen và bóng cứng, cùng ngôn ngữ với
 * các tấm biển trong app. Dùng divIcon nên không phụ thuộc ảnh marker
 * mặc định của Leaflet (thứ hay vỡ đường dẫn khi bundle).
 */
function pinIcon(active: boolean): L.DivIcon {
  const size = active ? 20 : 14;
  return L.divIcon({
    className: "",
    html:
      `<span style="display:block;width:${size}px;height:${size}px;` +
      `background:${active ? "#ffce2e" : "#fbf4e2"};` +
      `border:2px solid #06282b;box-shadow:2px 2px 0 #06282b"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const meIcon = L.divIcon({
  className: "",
  html:
    '<span style="display:block;width:14px;height:14px;border-radius:50%;' +
    'background:#5fc4a8;border:3px solid #06282b"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/** Kéo bản đồ theo khi người dùng đổi vị trí hoặc bán kính. */
function Recenter({ lat, lng, radius }: { lat: number; lng: number; radius: number }) {
  const map = useMap();
  useEffect(() => {
    const zoom = radius <= 1000 ? 15 : radius <= 2000 ? 14 : 13;
    map.setView([lat, lng], zoom);
  }, [map, lat, lng, radius]);
  return null;
}

export default function StoreMap({
  center,
  radius,
  stores,
  selectedId,
  onSelect,
}: IProps) {
  return (
    <div className="border-2 border-ink shadow-hard-deep">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: 260, width: "100%", background: "#08383c" }}
      >
        {/* Nhuộm tile về tông men xanh cho khớp phần còn lại của app */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          className="filter-[grayscale(1)_brightness(0.5)_sepia(0.7)_hue-rotate(133deg)_saturate(2.6)_contrast(1.1)]"
        />
        <Recenter lat={center.lat} lng={center.lng} radius={radius} />
        <Circle
          center={[center.lat, center.lng]}
          radius={radius}
          pathOptions={{
            color: "#ffce2e",
            weight: 2,
            dashArray: "6 5",
            fillColor: "#ffce2e",
            fillOpacity: 0.06,
          }}
        />
        <Marker position={[center.lat, center.lng]} icon={meIcon} />
        {stores.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={pinIcon(s.id === selectedId)}
            title={`${STORE_TYPE_LABELS[s.type]} · ${s.name}`}
            eventHandlers={{ click: () => onSelect(s.id) }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
