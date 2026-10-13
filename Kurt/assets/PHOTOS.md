# Photo & video slots — Minnesota Made Hockey

**No photos of Kurt or his players are on the site yet.** Every image frame currently shows
original rink artwork from `assets/art/` (ice, puck, crease, drills, centre ice). That is
deliberate: the site does not use stock photos of coaches or kids that could be mistaken for
Kurt's own sessions.

When Kurt sends real photos, swap them in. Prioritise: Kurt coaching, Kurt speaking with
players, individual instruction, group practice, young players on the ice, rink-side moments,
skill-development drills, natural candid shots. Use 4–8 of the strongest — no photo dump.
Confirm parents are happy for any child to appear before publishing.

| Slot (in `index.html`) | Current art | Best real photo |
|---|---|---|
| Meet Kurt — `.about__photo` | `art/night.svg` | Kurt coaching or at the rink (portrait, 4:5) |
| Development stage photos — `.pl__media` (3 images, in tab order) | `drill.svg`, `puck.svg`, `crease.svg` | Starting out / Developing / Building confidence |
| Gallery feature — `.reel__feature` | `art/ice-wide.svg` | A wide practice shot (16:9) |
| Gallery tiles — `.grid .tile` (6) | various | Rink-side instruction, drills, young players, group practice, talking it through, one-on-one |
| Menu card — `.menu__photo` | `art/night.svg` | Any strong landscape shot |

## How to swap one in

1. Export WebP (and optionally AVIF) at two widths, e.g. `kurt-about-800.webp` and `kurt-about-1300.webp`, compressed (~80 quality).
2. Replace the `<img src="assets/art/…">` with a real `src` / `srcset` / `sizes`, keep `loading="lazy"`,
   and write a real `alt` (what the photo shows — e.g. "Kurt Johnson talking with two young players at the boards").
3. Remove the matching "Photo slot · coming soon" / "Photo of Kurt coming soon" caption text.
4. In the gallery, add `<button type="button" class="tile__open" data-full="assets/…-1600.webp" aria-label="View larger: …"></button>`
   inside a tile to open it in the built-in viewer.

## Video

There is no video section on purpose. If Kurt provides his own training footage, add one main
clip (plus optional short clips) as a "Training in motion" section. Do not use NHL or stock
hockey footage.
