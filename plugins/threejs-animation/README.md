# Three.js Animation (Qoder Plugin)

Qoder-native packaging of the **threejs-animation** skill: a complete reference
for animating with Three.js.

## What it does
Covers the Three.js animation system end to end:
- AnimationClip / AnimationMixer / AnimationAction
- KeyframeTrack types and interpolation modes
- Loading and playing GLTF animations
- Skeletal animation (bones, attachments) and morph targets
- Animation blending (weighted + additive) and crossfading
- Procedural motion patterns (smooth damping, spring physics, oscillation)
- Performance tips

Use when animating objects, playing GLTF animations, creating procedural
motion, or blending animations.

## Included
- `skills/threejs-animation/SKILL.md` — full converted skill (verbatim content).
- `assets/avatar.svg` — generated logo (provenance: created for this package).

## Source / provenance
- Source: https://github.com/CloudAI-X/threejs-skills/blob/main/skills/threejs-animation/SKILL.md
- Author: CloudAI-X (threejs-skills).

## Omitted files
- None. The source SKILL.md is self-contained; the "See Also" references
  (`threejs-loaders`, `threejs-fundamentals`, `threejs-shaders`) are sibling
  skills in the source repo, not local support files.

## Setup notes
- No credentials required.
- Consuming projects need the `three` npm package installed.

## Validation
```bash
python3 scripts/validate_qoder_plugin.py plugins/threejs-animation
```
