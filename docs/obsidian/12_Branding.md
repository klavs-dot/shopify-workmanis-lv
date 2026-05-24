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

## Animāciju slāņi (15 — atjaunināts 2026-05-24)

Visi auto-running, `prefers-reduced-motion` respektēts (auto-pause sistēmas iestatījumos). 15 slāņi ar **coprime cikla garumiem** (galvenokārt pirmskaitļi: 1.3 / 1.7 / 2.1 / 3.7 / 4.3 / 4.5 / 5.2 / 5.9 / 7.3 / 8.1 / 9.7 / 11.3 / 13.1 / 17.9 / 19 sekundes) — jo cikli nesinhronizējas, kombinētā kustība praktiski nekad neatkārtojas, lietotājs vienmēr redz svaigu pozu.

| # | Slānis | Cikls | Efekts | CSS klase |
|---|---|---|---|---|
| 1 | Korpuss bob | 4.5s | Maigi šūpojas augšup-lejup | `rl-bob` |
| 2 | Korpuss side sway | 8.1s | Sānis-pa-sānis rotācija ±1.5° | `rl-sway` |
| 3 | Liels lēciens | 17.9s | Reti "yay" lēciens uz augšu (88-100% cikla) | `rl-jump` |
| 4 | Antenas LED pulse | 1.7s | Opacity + scale | `rl-blip` |
| 5 | Antenas sway | 5.9s | Antena pati šūpojas neatkarīgi no pulse | `rl-ant-sway` |
| 6 | LED halo | 1.7s | Glow halo sinhroni ar pulse | `rl-glow` |
| 7 | Acis blink | 4.3s | Abas acis aizveras momentāni | `rl-eye` |
| 8 | Kreisās acs zīlīte | 11.3s | Look subtle left/right | `rl-pupil-l` |
| 9 | Labās acs zīlīte | 13.1s | Diff. cikls → asimetrisks skats | `rl-pupil-r` |
| 10 | Wink | 19s | Tikai kreisā acs (rets) | `rl-wink` |
| 11 | Smile flash | 7.3s | Mute uz brīdi pacelta augšup | `rl-mouth` |
| 12 | Rakstīšanas roka | 1.3s | Translate + rotate skribelē | `rl-pen-arm` |
| 13 | Pen tap pauze | 5.2s | Apturēt rakstīšanu, viegls tap | `rl-tap` |
| 14 | Kreisās rokas (clip) sway | 9.7s | Klipboards viegli sasveras | `rl-clip-arm` |
| 15 | Papīra sparkle | 3.7s | ✨ pie pildspalvas gala | `rl-sparkle` |
| (16) | Labās kājas tap | 2.1s | Reizēm pacelta | `rl-foot-r` |

## Izmantošanas vietas un izmēri

| Vieta | Robots | Wordmark |
|---|---|---|
| Sidebar (desktop, w-56) | `h-28` (112×112px), centrēts | `WORKMANIS` `text-2xl` + subtitle `text-xs` |
| Mobile top nav | `h-12` (48×48px) inline pa kreisi | `WORKMANIS` `text-lg` + subtitle `text-[10px]` |
| Login karte | `h-48` (192×192px) centrēts | `WORKMANIS` `text-4xl` + `Shopify Pallet Operations` + project disambiguation |

## Saistītās piezīmes

- [[00_Project_Overview]] — kāpēc šis ir atsevišķs projekts no Workmanis.lv
