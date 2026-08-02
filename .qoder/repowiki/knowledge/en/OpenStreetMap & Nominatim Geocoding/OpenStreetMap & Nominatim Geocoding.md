---
kind: external_dependency
name: OpenStreetMap & Nominatim Geocoding
slug: openstreetmap
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

Used for two purposes: (1) Overpass API for querying nearby stores/markets by geographic coordinates, (2) Nominatim for address geocoding to convert user addresses to lat/lng coordinates. Both services are free but require proper User-Agent headers. OSM tiles serve as map background in Leaflet.