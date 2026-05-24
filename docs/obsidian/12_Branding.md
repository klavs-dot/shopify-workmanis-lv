# 12 — Branding

> Brand veidols pievienots 2026-05-24 (commits `5c4f0ea`, `196d301`, `736f407`).

## Wordmark

| Element | Vērtība |
|---|---|
| Primary | **WORKMANIS** (Inter extrabold, tracking-tight, slate-900) |
| Subtitle | **Shopify Pallet Operations** (slate-500/600) |
| Document title | "WORKMANIS — Shopify Pallet Operations" |

Lai gan domēns ir `shopify.workmanis.lv`, vizuālais brand ir vienkārši **WORKMANIS** (saskan ar Workmanis.lv komandcentra stilu), un subtitle saka, ka šis ir **Shopify Pallet Operations** modulis.

## Robot logo

`src/components/RobotLogo.tsx` — pure inline SVG, bez Lottie / image asset / JS animation loop.

### Krāsu shēma

| Komponents | Krāsa | Iemesls |
|---|---|---|
| Korpuss gradient | violet-500 → violet-800 (`#8b5cf6` → `#5b21b6`) | Atšķiras no Workmanis.lv zilā robota |
| Galva gradient | violet-400 → violet-700 (`#a78bfa` → `#7c3aed`) | Viegls gaišāks akcents |
| Acis | cream balti (`#fef3c7`) + dark navy pupiles (`#1e1b4b`) | Kontrasts |
| Antenas LED | amber-500 (`#f59e0b`) + glow halo amber-400 | Aktīvs / dzīvs vizuāls |
| Manifests papīrs | yellow-100 → amber-200 gradient (`#fef9c3` → `#fde68a`) | Silts, palešu kartonāža |
| Papīra līnijas + klips | amber-800 (`#a16207`) + slate-800 | Ar nelielu kontrastu |
| Pildspalva | slate-800 melnais korpuss + violet-500 highlight + amber tip | Atspoguļo brand colors |
| Pēdas | dark navy (`#1e1b4b`) | Stabilitāte |

## Animāciju slāņi (4)

Visi auto-running, `prefers-reduced-motion` respektēts (auto-pause sistēmas iestatījumos).

| Slānis | Cikls | Efekts | CSS keyframes |
|---|---|---|---|
| Korpuss `bob` | 3s | Maigi šūpojas augšup-lejup (-1.5px) | `rl-bob` |
| Antenas LED `blip` + halo `glow` | 1.5s | Pulsē opacity 0.55→1, scale 0.9→1.3 + glow halo | `rl-blip`, `rl-glow` |
| Acis `blink` | 5s | 95% cikla `scaleY(1)`, 5% cikla `scaleY(0.1)` | `rl-blink` |
| Pildspalvas roka `write` | 1.4s | translate + rotate "skribelēšana" virs manifesta | `rl-write` |

## Izmantošanas vietas un izmēri

| Vieta | Robots | Wordmark |
|---|---|---|
| Sidebar (desktop, w-56) | `h-28` (112×112px), centrēts | `WORKMANIS` `text-2xl` + subtitle `text-xs` |
| Mobile top nav | `h-12` (48×48px) inline pa kreisi | `WORKMANIS` `text-lg` + subtitle `text-[10px]` |
| Login karte | `h-48` (192×192px) centrēts | `WORKMANIS` `text-4xl` + `Shopify Pallet Operations` + project disambiguation |

## Saistītās piezīmes

- [[00_Project_Overview]] — kāpēc šis ir atsevišķs projekts no Workmanis.lv
