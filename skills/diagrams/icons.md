# The object kit — drafting-table axonometric

A hand-drawn set of constructed objects for diagram nodes. They are not stock icons dropped
beside a label; each is a small **isometric drawing of the thing itself**, built so a reader
recognises *what a node is* before reading a word. The node's form carries the category; the
label only names it. Measurement stays with the flat property-glyphs in `SKILL.md` (score bar,
record field, magnitude bar, timeline) — **objects are drawn in projection, data is drawn
flat.** An object and a property-glyph are used together, never one in place of the other.

This file is the language, not just a list: read the construction law first, then the roster,
then **how to draw a new object in the same hand** — that last section is what makes this a
skill rather than a set.

## The construction law (one hand)

Everything obeys these five rules, so the whole set reads as drawn by one person on one
drafting table. Break one and the object stops belonging.

1. **Projection — 2:1 dimetric.** Every receding edge has slope **exactly ±0.5** (one down for
   every two across). Verticals stay vertical. A width run of 20px drops 10; a run of 16 drops
   8. This exact parallelism is the tell that says *constructed, not sketched* — never freehand
   an isometric angle, compute it.
2. **One light source — top-front-left.** Depth is flat `currentColor` face-tone, never a
   gradient: **top face `opacity .05`, right face `.13`, left/shadow face `.22`.** Hero objects
   (≥56px) also carry a few vertical hairline strokes on the left face — the drafted shadow
   side. That is the entire depth system: tone and hatch, no gradient, no drop shadow, no bevel
   (all three invert badly when the theme flips).
3. **Three line weights.** Structural silhouette and main edges `1.6`; interior construction
   `1.0`; hairline hatch, ticks and grid `0.5` (native 48-grid; ratios hold at any scale).
   Round caps and joins throughout.
4. **Colour is `currentColor`.** Tint a `<use>` by setting `color` — `var(--pen-m)` (Michael),
   `var(--pen-d)` (Dmitry), `var(--ink-soft)` (unattributed). One pen per actor, held across the
   whole set exactly as pens are used everywhere else. Depth and emphasis come from tone and
   fill density, **never a new hue**. No literal hex, no `fill="white"`, no font, no emoji, no
   external anything — a hard-coded colour fails `lint-diagrams` and goes invisible for half the
   readers.
5. **Absent / unbuilt / not-shown.** The *same object silhouette* drawn as a dashed 1px
   wireframe — no face tone, no hatch. A thing drafted but not built. (For a pure gap with no
   object, the flat dashed slot in `SKILL.md` still applies.)

## How to use

Inline the sprite once at the top of the fragment (copy `icons.svg`'s `<svg …>` block, or paste
its symbols into your own hidden `<svg>`), then reference an object anywhere:

```html
<svg class="ic" viewBox="0 0 48 48" style="color:var(--pen-m)">
  <use href="#icon-database"/>
</svg>
```

- **Sizes.** Hero object 56–96px (real internal detail — this is where a node earns the page);
  secondary 40–52px; small repeated mark or timeline/row label 22–30px. Native grid is 48; the
  objects stay legible scaled anywhere in that range. Nothing important is a 20px bullet.
- **The object leads the node.** Place it as the node's head, not tucked beside a label. Where an
  object can stand on its own, **dissolve the bordered box** and let the form carry the node —
  the border is decoration a real drawing does not need.
- **Animate like anything else.** The `<use>` (or the shapes, if you inline a symbol) take
  `data-draw` / `data-fade` and reveal in reading order. Nothing loops after the reveal.

## The roster

Each entry: **name** — what it is · when to use · failure mode. Colour is set by the caller.

### Data & storage
- **database** — a tall isometric cylinder with ring divisions (rows). Salesforce, a
  SQL/Postgres store, any keyed table. *Failure:* using it for a vector index — the cylinder says
  "rows", not "embeddings"; keep the shapes distinct.
- **vector-index** — an isometric block whose **top face is a joined point-cloud** (the embedding
  space). FAISS, a semantic/similarity index. *Failure:* using `database` for it erases the one
  property that matters — lookup by distance, not by key.
- **document** — a thin isometric slab, printed lines and a folded corner on the page. One
  manual, page, spec, scraped article. *Failure:* using it for a corpus understates volume — reach
  for `document-stack`.
- **document-stack** — three offset slabs = real depth. A corpus, a batch of attachments,
  "20–50 docs". *Failure:* using it for one artifact inflates the claim.
- **pdf** — a slab with a solid banner on the page = a *formatted* file. Use when the format is the
  point (a scan that needed extraction). *Failure:* badging every document — the banner means "this
  one is formatted", so on all, nothing.
- **image** — an isometric frame whose page shows a mountain and sun = raster/scan. An attachment
  photo, a screenshot fed to vision/OCR. *Failure:* using `document` for it hides that it is
  unstructured pixels, the whole reason OCR exists in the figure.

### Work items & flow
- **ticket** — a slab with a perforation and a corner notch = a routable unit of work. A
  Salesforce case, a Freshdesk/ServiceNow ticket. *Failure:* using `document` loses that it gets
  routed and closed.
- **inbox** — an open isometric tray with slips = a queue / place of incoming work. The backlog,
  an intake queue, "119,000 cases" as a place. *Failure:* using it for one item — it is the
  container, not the contents.
- **filter** — an isometric funnel narrowing to a stem = triage / classify. *Failure:* using it
  where nothing is dropped or split.
- **fork-in-road** — a ground-plane path splitting two ways = a branch in logic, L1 vs L2.
  *Failure:* using it for a smooth stage where nothing chooses.

### Agents & people
- **robot** — an isometric cube head, eyes on the front face, antenna = the AI agent / an
  autonomous step. LangGraph, an LLM doing work. *Failure:* placing it beside a human step
  decoratively erases the one distinction the figure makes.
- **person** — a constructed bust, drawn **frontally on purpose**. This is the one deliberate
  break from projection: *people face you; built things are drawn in axonometric.* That contrast
  is a signal, not an accident — a human step reads as human at a glance. *Failure:* using it for a
  machine step, collapsing the human/machine line.
- **team** — two busts offset in depth = a group / headcount. *Failure:* using it for one named
  individual — that is `person`.
- **building** — a tall isometric block with window dots on both faces = an organisation / paying
  customer / site. *Failure:* using it for a server room — that is `server`.

### Compute & infrastructure
- **server** — a wide, short isometric rack, front face slotted with LEDs = a running host, and
  the default **repository** body (a store that runs code). Fly.io, an EC2-like box, the repo the
  branches emerge from. *Failure:* using `database` for a compute host — one runs code, the other
  holds data.
- **cloud** — a bold constructed puff on a thin isometric base = a hosted/off-prem service. A cloud
  vision model, a managed platform. *Failure:* using it for an on-prem/local step — pair it against
  `server` or `laptop` when that contrast is the point.
- **laptop** — an isometric base plane (keys) plus a raised screen plane = a local/dev machine.
  *Failure:* using it for production hosting — reach for `server`.
- **terminal** — an isometric screen block, prompt chevron and cursor = a deterministic CLI tool.
  A local OCR/OpenCV reader, "deterministic, on this machine". *Failure:* using it for a stochastic
  model — a terminal reads as "exact and repeatable".
- **api** — an isometric socket with two prongs = a crossed service boundary. *Failure:* using it
  as decoration; it means "a boundary is crossed here".
- **gear** — a short isometric disc with teeth and a hub = a process / mechanism / configured job.
  A transforming pipeline stage, RRF. *Failure:* using it for a decision (that is a gate chain) or
  a data store.
- **gate** — an isometric pipe segment with a valve wheel = a single control on a flow. A
  throughput valve, an approval hold. *Failure:* using it for a chain of classifying rejections —
  that is the diamond gate-chain glyph in `SKILL.md`; this valve is one control on one flow.

### Version & release
- **branch** — three nodes joined on isometric lines = a git graph; draw the lines **emerging from
  a repository object**, not floating. Stable/main/feature. *Failure:* using it for a deploy
  target — that is `server`/`cloud`.
- **tag** — an isometric luggage tag with a hole = a release label / version. A version number, a
  cut. *Failure:* using it where nothing is versioned.

### Signals & outcomes
- **search** — a bold lens ring on an isometric handle = a lookup / query / retrieval. *Failure:*
  using it for a filter — search finds, a funnel narrows.
- **alert** — a triangular prism sign with a bar = a warning / risk / failure signal. A regression,
  a hallucination risk. *Failure:* using it for a normal step.
- **check** — an isometric stamp token with a tick on its face = confirmed / passed / done.
  "Measured and kept", a completed field. *Failure:* using it for `shield`; check means "this
  happened and was confirmed", shield means "this prevents".
- **shield** — a plate with a thin isometric edge and a tick = a guardrail / prevention. The OCR
  guardrail. *Failure:* using it as a generic "good" mark — that is `check`.
- **chart-up** — three bars rising on an isometric plinth = a measured gain. "+6%", profitability.
  *Failure:* using it where no quantity actually rose.
- **coin** — a short isometric disc-stack with a value slash = money / cost / revenue. A price, a
  saving, "$237K a year". *Failure:* using it for value in the abstract with no figure attached.
- **clock** — an isometric disc with hands on its face = time as a resource or constraint. "One
  hour a day", a deadline. *Failure:* using it on a timeline axis, which already encodes time — it
  is for time-as-subject.

### Connection
- **link** — two interlocked isometric chain links = a dependency / citation / provenance tie.
  *Failure:* using it for a data-flow arrow — an arrow shows direction, a link shows association.

## How to draw a NEW object in the same hand

When the subject needs an object the roster does not have, build it — do not reach for a library.
Six steps keep it in the one hand:

1. **Find the primitive.** Almost everything is one of four bodies: a **box** (the canonical slab
   — see `icons.svg` header for its exact vertices), a **cylinder** (database, coin, gear, clock,
   check), a **thin slab** (document, ticket, pdf, image), or a **bracketed frame / plane pair**
   (laptop, terminal, api). Pick the closest and start from its faces.
2. **Lay the top rhombus, then drop the height.** Top face first (slopes ±0.5), then extrude
   straight down for the two side faces. Never let a receding edge drift off ±0.5.
3. **Tone the three faces** — top `.05`, right `.13`, left `.22`, all `currentColor`. If it is a
   hero, add two or three vertical hairlines on the left face. That is the whole depth pass.
4. **Add the one identifying detail** on the lightest face a reader will look at — the mark that
   makes it *this* object and nothing else (the point-cloud that makes a block a vector index; the
   perforation that makes a slab a ticket). One detail, drawn at weight `1.0`, is usually enough.
5. **Weight the lines** — silhouette `1.6`, construction `1.0`, hatch/detail `0.5`. If it reads as
   one flat weight, it will read as a stock icon.
6. **Test it three ways.** Recolour it `var(--pen-d)` and `var(--ink-soft)` (still legible?), scale
   it to 24px and 72px (detail survives, silhouette holds?), and apply the swap test: **if this
   object could be replaced by a different object without changing the node's claim, it has failed
   — redraw until the form is the meaning.**

Give a genuinely reusable new object its own `id` in `icons.svg` and a roster line here. A
one-off may be inlined in the figure, but it still obeys all five construction rules.

## The rule the kit serves

A node whose only content is words has failed. Give it its object — drawn, not iconified — its
label, and one clause of note; let a flat property-glyph carry any measurement. A node whose object
could be swapped for any other object without loss has also failed: the geometry, not the label,
must carry which thing it is. See `SKILL.md`, "The node rule".
