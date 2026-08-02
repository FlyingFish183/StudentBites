---
kind: external_dependency
name: Interactive Map Library
slug: leaflet
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

Client-side mapping library loaded dynamically via next/dynamic with ssr:false due to browser-only dependencies. Used to display nearby stores with markers, radius circles, and popups. Requires OpenStreetMap tile server for base maps.