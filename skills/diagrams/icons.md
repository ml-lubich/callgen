# Icon set

Thirty-one hand-drawn object icons for diagram nodes. They carry the **category** of a
node — the thing it *is* — so a reader recognises it before reading the label. They do not
carry measurement; that stays with the property-glyphs in `SKILL.md` (score-scale bar,
record field, gate chain, magnitude bar). A node is **icon + label + one-clause note**, and
the icon and a property-glyph are used together, not in place of each other.

## How to use

Inline the sprite once at the top of the fragment (copy `icons.svg`'s `<svg …>` block, or
paste its symbols into your own hidden `<svg>`). Then reference an icon anywhere:

```html
<svg class="ic" width="30" height="30" viewBox="0 0 24 24" style="color:var(--pen-m)">
  <use href="#icon-database"/>
</svg>
```

- **Colour comes from `currentColor`.** Tint by setting `color` (or `style="color:…"`) to
  `var(--pen-m)`, `var(--pen-d)` or `var(--ink-soft)` on the `<use>` or an ancestor. One pen
  per actor, held across the set, exactly as the pens are used everywhere else.
- **Size 20–64px.** Drawn on a 24×24 grid at stroke-width 1.5; they stay legible when scaled
  into that range. Below 18px the depth layer muddies — drop to the linework only by hand if
  you must go smaller.
- **Depth is built in.** Each icon has one fill layer at ~10–12% opacity behind the linework
  (top-left light source) and isometric construction where an object has real volume
  (database, document-stack, server, coin). No gradients, shadows or bevels — those break in
  dark mode. Do not add them.
- **No literal colour, no font, no emoji, no external library.** The sprite is self-contained
  inline SVG. A hard-coded hex or a `fill="white"` will fail `lint-diagrams`.
- **Animate like anything else.** The `<use>`, or shapes if you inline the symbol, take
  `data-draw` / `data-fade` and reveal in reading order. Nothing loops after the reveal.

## The icons

Each entry: **name** — what it means · when to use · failure mode.

### Data & storage
- **database** — a relational or document store, drawn as a cylinder. Use for Salesforce, a
  SQL/Postgres store, any keyed table. *Failure:* do not use for a vector index — the shapes
  must stay distinct; a cylinder says "rows", not "embeddings".
- **vector-index** — an embedding / similarity index, drawn as points joined in a space. Use
  for FAISS, a semantic index, a nearest-neighbour store. *Failure:* using `database` for it
  erases the one property that matters — that lookup is by distance, not by key.
- **document** — one text document with a folded corner. Use for a single manual, a page, a
  spec, a scraped article. *Failure:* using it for a stack of sources understates volume —
  reach for `document-stack`.
- **document-stack** — many documents, drawn as offset sheets. Use for a corpus, a batch of
  attachments, "20–50 docs". *Failure:* using it for a single artifact inflates the claim.
- **pdf** — a formatted/portable document, document with a solid label banner. Use when the
  *format* is the point (a PDF scan that needed extraction). *Failure:* badging every
  document as a pdf — the banner means "this one is a formatted file", so on all, nothing.
- **image** — a raster image or scan, drawn as a framed picture. Use for an attachment photo,
  a screenshot, a scanned page fed to vision/OCR. *Failure:* using `document` for an image
  hides that it is unstructured pixels, which is the whole reason OCR exists in the figure.

### Work items & flow
- **ticket** — a support case / issue, drawn as a ticket stub with a perforation. Use for a
  Salesforce case, a Freshdesk/ServiceNow ticket, a queue item. *Failure:* using `document`
  for a ticket loses that it is a unit of work that gets routed and closed.
- **inbox** — a queue or tray of incoming work. Use for the case backlog, an intake queue,
  "119,000 open cases" as a place. *Failure:* using it for one item — it is the container,
  not the contents.
- **filter** — a funnel that narrows or classifies. Use for triage, a routing filter, a
  narrowing step. *Failure:* using it where nothing is actually dropped or split — a funnel
  that passes everything is a lie.
- **fork-in-road** — a decision that sends work down one of two paths. Use for a branch in
  logic, "L1 vs L2", a routing choice. *Failure:* using it for a smooth pipeline stage where
  nothing chooses.

### Agents & people
- **robot** — an AI agent / autonomous step, drawn as a robot head. Use for the LangGraph
  agent, an LLM doing work, "the AI built it". *Failure:* using it beside a human step
  decoratively erases the one distinction the figure is making.
- **person** — a single human step. Use for the lead tech, the representative, "he initiates
  every push". *Failure:* using it for a machine step, collapsing the human/machine line.
- **team** — two or more people. Use for a support team, a group of managers, a headcount.
  *Failure:* using it for one named individual — that is `person`.
- **building** — an organisation / paying customer / site. Use for Brio as a customer, a
  company, an on-prem site. *Failure:* using it for a server room — that is `server`.

### Compute & infrastructure
- **server** — a host / rack / running backend, drawn as isometric rack units with LEDs. Use
  for a Fly.io box, an EC2-like instance, an on-prem server. *Failure:* using `database` for
  a compute host — one runs code, the other holds data.
- **cloud** — a hosted/off-prem service. Use for a cloud vision model, a managed platform,
  "in the cloud, can hallucinate". *Failure:* using it for an on-prem/local step, which is
  the opposite claim — pair it against `server` or `laptop` when that contrast is the point.
- **laptop** — a local/developer machine. Use for local work, a dev environment, a demo
  laptop. *Failure:* using it for production hosting — reach for `server`.
- **terminal** — a command line / script / deterministic tool, drawn as a prompt screen. Use
  for a CLI, a local OCR/OpenCV reader, "deterministic, on this machine". *Failure:* using it
  for a stochastic model — a terminal reads as "exact and repeatable".
- **api** — a service boundary / connector, drawn as a plug. Use for an API call, an
  integration point, a plug between systems. *Failure:* using it as generic decoration; it
  means "a boundary is crossed here".
- **gear** — a process / configured job / mechanism. Use for a pipeline stage that transforms,
  a background job, "the process". *Failure:* using it for a decision (use `fork-in-road` or a
  gate-chain) or a data store.

### Version & release
- **branch** — a git branch / line of development. Use for stable/main/feature, a fork of
  work, "the three lines he must point at". *Failure:* using it for a deploy target — that is
  `server`/`cloud`.
- **tag** — a release tag / version / label, drawn as a tag with a hole. Use for a version
  number, a release cut, a labelled state. *Failure:* using it where nothing is versioned.
- **gate** — a valve / control point / guarded pass, drawn as a pipeline valve. Use for a
  throughput control, an approval valve, a place where flow is held or let through.
  *Failure:* using it for a decision that classifies — that is the diamond gate-chain glyph
  in `SKILL.md`; this valve is a single control on a flow, not a chain of rejections.

### Signals & outcomes
- **search** — a lookup / query / retrieval, drawn as a magnifier. Use for a search step, a
  query, "find the matching record". *Failure:* using it for a filter — search finds, a
  funnel narrows.
- **alert** — a warning / risk / failure signal, drawn as a warning triangle. Use for a
  regression, a hallucination risk, "it already broke". *Failure:* using it for a normal step
  — it must mean something went or can go wrong.
- **check** — a verified / passed / done state, drawn as a circled tick. Use for "measured and
  kept", a passing test, a completed field. *Failure:* using it interchangeably with
  `shield`; check means "this happened and was confirmed", shield means "this protects".
- **shield** — a guardrail / protection / safety layer, drawn as a shield with a tick. Use for
  the OCR guardrail, a safety check that prevents a bad outcome. *Failure:* using it as a
  generic "good" mark — that is `check`; the shield silhouette means *prevention*.
- **chart-up** — a rising result / growth / measured gain. Use for "+6% accuracy",
  profitability, an upward trend. *Failure:* using it where no quantity actually rose.
- **coin** — money / cost / revenue, drawn as an isometric coin stack. Use for a price, a
  saving, "$237K a year", the spend rule. *Failure:* using it for value in the abstract when
  no figure is attached — pair it with a real number.
- **clock** — time as a resource or constraint. Use for "one hour a day", a deadline, elapsed
  time as the point. *Failure:* using it on a timeline axis, which already encodes time — it
  is for time-as-subject, not time-as-axis.

### Connection
- **link** — a dependency / reference / citation tie, drawn as two chain links. Use for a
  citation, a link between two records, a provenance tie. *Failure:* using it for a data flow
  arrow — an arrow shows direction, a link shows association.

## The rule the icons serve

A node whose only content is words has failed. Give it its category icon, its label, and one
clause of note; let a property-glyph carry any measurement. See `SKILL.md`, "The node rule".
