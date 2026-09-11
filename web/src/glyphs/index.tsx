/**
 * The glyph library: small SVG parts figures are assembled from. Every one of them
 * draws in currentColor and CSS variables only, so a glyph inherits its figure's pen
 * and works in both themes without a second definition.
 */
import type { ReactNode } from "react";
import { CountUp } from "../components/CountUp";
import { Icon, type IconName } from "./icons";
import { type Pen, penClassName } from "./pen";

export type { Pen };
export { penClassName };
export { Icon, IconSprite, ICON_NAMES, type IconName } from "./icons";

const SOFT = "var(--ink-soft)";
const GRID = "var(--grid)";
const INK = "var(--ink)";
const PAPER_2 = "var(--paper-2)";

/**
 * Advance per character as a fraction of the font size, for the condensed face the
 * figures are set in. Deliberately a shade wide: a label that stops one character early
 * is readable, a label that runs off the plate is not.
 */
const CH = 0.54;

/** The most characters that fit in `px` at `size`. */
function room(px: number, size: number): number {
  return Math.max(1, Math.floor(px / (size * CH)));
}

/** `text` cut to what fits, with an ellipsis where it was cut. */
export function fit(text: string, px: number, size = 13): string {
  const max = room(px, size);
  if (text.length <= max) return text;
  return text.slice(0, Math.max(1, max - 1)).trimEnd() + "…";
}

/** `text` broken over at most `lines` lines of `px`, cutting the last one if it must. */
export function wrap(text: string, px: number, size: number, lines: number): string[] {
  const per = room(px, size);
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= per) {
      line = next;
      continue;
    }
    if (line) out.push(line);
    line = word;
    if (out.length === lines) break;
  }
  if (line && out.length < lines) out.push(line);
  const kept = out.slice(0, lines);
  if (kept.join(" ") !== text.replace(/\s+/g, " ").trim() && kept.length) {
    kept[kept.length - 1] = fit(kept[kept.length - 1] + " …", px, size);
  }
  return kept;
}

/**
 * A label that stays inside the plate. It is cut to the room it was given and, when it
 * had to be cut, carries the full value as its own `<title>` so nothing is lost to a
 * reader who cannot see the drawing.
 */
function Label({
  children,
  x,
  y,
  px,
  size = 13,
  lines = 1,
  anchor,
  fill = SOFT,
  weight,
  lead,
}: {
  children: string;
  x: number;
  y: number;
  /** The room the label has, in viewBox units. */
  px: number;
  size?: number;
  lines?: number;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  weight?: number;
  /** Line height, when the label runs to more than one line. */
  lead?: number;
}) {
  const rows = lines > 1 ? wrap(children, px, size, lines) : [fit(children, px, size)];
  const clipped = rows.join(" ") !== children.replace(/\s+/g, " ").trim();
  return (
    <text x={x} y={y} fontSize={size} textAnchor={anchor} fill={fill} fontWeight={weight}>
      {clipped && <title>{children}</title>}
      {rows.length === 1 ? (
        rows[0]
      ) : (
        rows.map((row, i) => (
          <tspan key={row + i} x={x} dy={i === 0 ? 0 : (lead ?? size * 1.3)}>
            {row}
          </tspan>
        ))
      )}
    </text>
  );
}

/** Shared frame: a titled svg that scales to its container and never overflows it. */
function Frame({
  w,
  h,
  title,
  desc,
  className,
  pen,
  children,
}: {
  w: number;
  h: number;
  title: string;
  /** The figure read aloud in its reading order, for a reader who cannot see it. */
  desc?: string;
  className?: string;
  pen?: Pen;
  children: ReactNode;
}) {
  return (
    <svg
      className={penClassName(pen, className)}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMinYMid meet"
      style={{ display: "block", width: "100%", height: "auto", maxWidth: w }}
    >
      <title>{title}</title>
      <desc>{desc || title}</desc>
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ ScaleBar */

/**
 * A score on a bar. `bounded` fills a 0–1 track, `unbounded` runs off the end behind a
 * ≫ overflow mark, and `own` labels the track with the range it is actually drawn on.
 */
export function ScaleBar({
  value,
  label,
  kind = "bounded",
  min = 0,
  max = 1,
  pen = "neutral",
  width = 320,
}: {
  value: number;
  label?: string;
  kind?: "bounded" | "unbounded" | "own";
  min?: number;
  max?: number;
  pen?: Pen;
  width?: number;
}) {
  const H = label ? 46 : 26;
  const y = label ? 28 : 10;
  const track = kind === "unbounded" ? width - 34 : width - 2;
  const span = max - min || 1;
  const fill = Math.max(0, Math.min(1, (value - min) / span)) * track;
  const over = kind === "unbounded" && value > max;
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={`${label ? label + ": " : ""}${value}`}
      desc={
        `${label ?? "A score"} of ${value} drawn on a ${kind} scale from ${min} to ${max}. ` +
        `Length along the track is the value.`
      }
      className="gl-scale"
    >
      {label && (
        <Label x={1} y={14} px={width - 4} size={12}>
          {label}
        </Label>
      )}
      <rect x={1} y={y} width={track} height={8} fill="none" stroke={GRID} />
      <rect x={1} y={y} width={fill.toFixed(1)} height={8} fill="currentColor" />
      <line x1={1 + fill} y1={y - 4} x2={1 + fill} y2={y + 12} stroke="currentColor" strokeWidth={1.4} />
      {over && (
        <text className="gl-lab" x={width - 26} y={y + 9} fill="currentColor">
          &#8811;
        </text>
      )}
      {kind === "own" && (
        <>
          <text className="gl-tick" x={1} y={y + 21} fill={SOFT}>
            {min}
          </text>
          <text className="gl-tick" x={track} y={y + 21} fill={SOFT} textAnchor="end">
            {max}
          </text>
        </>
      )}
    </Frame>
  );
}

/* ------------------------------------------------------------------ FieldRow */

/** One field of a record: never filled, filled, or filled and backed by a citation. */
export function FieldRow({
  label,
  state = "empty",
  fill = 0.68,
  pen = "neutral",
  width = 300,
}: {
  label: string;
  state?: "empty" | "filled" | "cited";
  fill?: number;
  pen?: Pen;
  width?: number;
}) {
  const barX = 116;
  const barW = width - barX - (state === "cited" ? 18 : 2);
  return (
    <Frame
      w={width}
      h={22}
      pen={pen}
      title={`${label} — ${state}`}
      desc={
        state === "empty"
          ? `The field ${label} is a dashed empty slot: it was never filled.`
          : `The field ${label} is filled, and the dot at the end marks a citation behind it.`
      }
      className="gl-field"
    >
      <Label x={0} y={14} px={barX - 8} size={12}>
        {label}
      </Label>
      {state === "empty" ? (
        <rect x={barX} y={6} width={barW} height={9} fill="none" stroke={GRID} strokeDasharray="3 3" />
      ) : (
        <>
          <rect x={barX} y={6} width={barW} height={9} fill="none" stroke={GRID} />
          <rect x={barX} y={6} width={(barW * Math.min(1, fill)).toFixed(1)} height={9} fill="currentColor" />
        </>
      )}
      {state === "cited" && <circle cx={width - 7} cy={10.5} r={3.5} fill="currentColor" />}
    </Frame>
  );
}

/* ------------------------------------------------------------------ DocGlyph */

/** A document: folded corner, three lines of text, and an optional processing badge. */
export function DocGlyph({
  badge,
  label,
  pen = "neutral",
  width = 84,
}: {
  badge?: string;
  label?: string;
  pen?: Pen;
  width?: number;
}) {
  const H = label ? 112 : 96;
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={label || badge || "document"}
      desc={`A sheet of paper with a folded corner and three ruled lines${
        badge ? `, stamped ${badge}` : ""
      }.`}
      className="gl-doc"
    >
      <path
        d="M6 6 h44 l20 20 v58 h-64 z"
        fill={PAPER_2}
        stroke="currentColor"
        strokeWidth={1.2}
      />
      <path d="M50 6 v20 h20" fill="none" stroke="currentColor" strokeWidth={1.2} />
      {[42, 54, 66].map((y, i) => (
        <line key={y} x1={16} y1={y} x2={i === 2 ? 44 : 60} y2={y} stroke={SOFT} strokeWidth={1.4} />
      ))}
      {badge && (
        <>
          <rect x={12} y={72} width={34} height={13} fill="currentColor" />
          <text className="gl-badge" x={29} y={81.5} textAnchor="middle" fill="var(--paper)">
            {fit(badge, 32, 9.5)}
          </text>
        </>
      )}
      {label && (
        <Label x={6} y={104} px={width - 8} size={12}>
          {label}
        </Label>
      )}
    </Frame>
  );
}

/* --------------------------------------------------------------- PersonGlyph */

/** A person. Head, shoulders, an optional name beneath. */
export function PersonGlyph({
  label,
  pen = "neutral",
  width = 64,
}: {
  label?: string;
  pen?: Pen;
  width?: number;
}) {
  const H = label ? 76 : 58;
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={label || "participant"}
      desc={`A head and shoulders standing for ${label || "one participant"}.`}
      className="gl-person"
    >
      <circle cx={32} cy={17} r={11} fill="none" stroke="currentColor" strokeWidth={1.4} />
      <path
        d="M11 52 a21 21 0 0 1 42 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      {label && (
        <Label x={32} y={68} px={width} size={12} anchor="middle">
          {label}
        </Label>
      )}
    </Frame>
  );
}

/* ----------------------------------------------------------------- GateChain */

/** n gates on a line: the shape a decision graph makes when every step can stop it. */
export function GateChain({
  n = 3,
  labels = [],
  passed = n,
  pen = "neutral",
  width = 360,
}: {
  n?: number;
  labels?: string[];
  passed?: number;
  pen?: Pen;
  width?: number;
}) {
  const H = labels.length ? 56 : 34;
  const step = (width - 32) / Math.max(1, n - 1 || 1);
  const cy = 17;
  const at = (i: number) => (n === 1 ? width / 2 : 16 + i * step);
  const slot = n === 1 ? width : step;
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={`${n} gates, ${passed} passed`}
      desc={
        `${n} diamond gates on one line, read left to right. The first ${passed} are filled: ` +
        `they were passed. The rest are open, and any one of them can stop the chain.`
      }
      className="gl-gates"
    >
      <line x1={at(0)} y1={cy} x2={at(n - 1)} y2={cy} stroke={GRID} strokeWidth={1.2} />
      {Array.from({ length: n }, (_, i) => {
        const x = at(i);
        const on = i < passed;
        return (
          <g key={i}>
            <path
              d={`M${x} ${cy - 9} L${x + 9} ${cy} L${x} ${cy + 9} L${x - 9} ${cy} Z`}
              fill={on ? "currentColor" : PAPER_2}
              stroke="currentColor"
              strokeWidth={1.2}
            />
            {labels[i] && (
              <Label x={x} y={cy + 30} px={slot} size={12} anchor="middle">
                {labels[i]}
              </Label>
            )}
          </g>
        );
      })}
    </Frame>
  );
}

/* ------------------------------------------------------------------- Cascade */

/** An escalation that steps down: each stage lower and narrower than the one before. */
export function Cascade({
  steps,
  pen = "neutral",
  width = 340,
}: {
  steps: string[];
  pen?: Pen;
  width?: number;
}) {
  const drop = 26;
  const H = steps.length * drop + 14;
  const run = (width - 8) / Math.max(1, steps.length);
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={steps.join(" → ")}
      desc={
        `${steps.length} stages stepping down and to the right, each one lower than the ` +
        `one before: ${steps.join(", then ")}.`
      }
      className="gl-cascade"
    >
      {steps.map((s, i) => {
        const y = 12 + i * drop;
        const x = 4 + i * (run * 0.34);
        return (
          <g key={s + i}>
            <line x1={x} y1={y} x2={x + run * 0.62} y2={y} stroke="currentColor" strokeWidth={1.6} />
            {i < steps.length - 1 && (
              <line
                x1={x + run * 0.62}
                y1={y}
                x2={x + run * 0.62}
                y2={y + drop}
                stroke={GRID}
                strokeWidth={1.2}
                strokeDasharray="2 3"
              />
            )}
            <Label x={x} y={y - 6} px={width - x - 4} size={12}>
              {s}
            </Label>
          </g>
        );
      })}
    </Frame>
  );
}

/* ------------------------------------------------------------- MagnitudeBar */

/** One bar against a shared maximum, for the comparisons that only work at scale. */
export function MagnitudeBar({
  label,
  value,
  max,
  display,
  pen = "neutral",
  width = 420,
}: {
  label: string;
  value: number;
  max: number;
  display?: string;
  pen?: Pen;
  width?: number;
}) {
  const barW = Math.max(1.5, (Math.max(0, value) / (max || 1)) * (width - 132));
  const shown = display ?? value.toLocaleString("en-US");
  return (
    <Frame
      w={width}
      h={34}
      pen={pen}
      title={`${label}: ${shown}`}
      desc={`A bar for ${label} drawn at true proportion against a shared maximum of ${max}. Its value is ${shown}.`}
      className="gl-mag"
    >
      <Label x={0} y={13} px={width} size={12}>
        {label}
      </Label>
      <rect x={0} y={19} width={barW.toFixed(1)} height={11} fill="currentColor" />
      <text className="gl-val" x={barW + 8} y={29} fill={INK}>
        {fit(shown, width - barW - 10, 13)}
      </text>
    </Frame>
  );
}

/* ---------------------------------------------------------------- BigNumber */

/** A figure set large enough to be read across the room, with its unit and its caption. */
export function BigNumber({
  value,
  unit,
  caption,
  display,
  pen = "neutral",
}: {
  value: number;
  unit?: string;
  caption?: string;
  display?: string;
  pen?: Pen;
}) {
  return (
    <div className={penClassName(pen, "gl-big")}>
      <div className="gl-big-v">
        {display ? <span>{display}</span> : <CountUp value={value} />}
        {unit && <span className="gl-big-u">{unit}</span>}
      </div>
      {caption && <div className="gl-big-c">{caption}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- Compare */

/** Two inputs meeting at a node — the point where a comparison actually happens. */
export function Compare({
  left,
  right,
  out,
  pen = "neutral",
  width = 320,
}: {
  left: string;
  right: string;
  out?: string;
  pen?: Pen;
  width?: number;
}) {
  const cx = width / 2;
  // each side gets its own half, less the clearance the two curves need in the middle
  const side = Math.max(24, cx - 24);
  return (
    <Frame
      w={width}
      h={92}
      pen={pen}
      title={`${left} compared with ${right}`}
      desc={
        `Two inputs, ${left} on the left and ${right} on the right, curve down into one ` +
        `node where they are compared${out ? `, and the node reads ${out}` : ""}.`
      }
      className="gl-compare"
    >
      <Label x={0} y={20} px={side} size={12}>
        {left}
      </Label>
      <Label x={width} y={20} px={side} size={12} anchor="end">
        {right}
      </Label>
      <path d={`M14 28 C14 50 ${cx - 24} 40 ${cx - 14} 46`} fill="none" stroke="currentColor" strokeWidth={1.3} />
      <path
        d={`M${width - 14} 28 C${width - 14} 50 ${cx + 24} 40 ${cx + 14} 46`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
      />
      <circle cx={cx} cy={46} r={11} fill={PAPER_2} stroke="currentColor" strokeWidth={1.3} />
      <line x1={cx - 6} y1={46} x2={cx + 6} y2={46} stroke="currentColor" strokeWidth={1.3} />
      <line x1={cx} y1={40} x2={cx} y2={52} stroke="currentColor" strokeWidth={1.3} />
      {out && (
        <>
          <line x1={cx} y1={57} x2={cx} y2={70} stroke={GRID} strokeWidth={1.2} />
          <Label x={cx} y={84} px={width - 8} size={12} anchor="middle" fill={INK}>
            {out}
          </Label>
        </>
      )}
    </Frame>
  );
}

/* --------------------------------------------------------------------- Route */

/** One source fanning out to the places it ends up. */
export function Route({
  from,
  to,
  pen = "neutral",
  width = 380,
}: {
  from: string;
  to: string[];
  pen?: Pen;
  width?: number;
}) {
  const gap = 26;
  const H = Math.max(70, to.length * gap + 18);
  const cy = H / 2;
  const x0 = 6;
  // the fan point travels with the plate, so a narrow figure keeps room on both sides
  const x1 = Math.min(138, Math.max(64, width * 0.36));
  const x2 = x1 + 30;
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={`${from} to ${to.join(", ")}`}
      desc={`${from} on the left fans out through one node into ${to.length} destinations: ${to.join(", ")}.`}
      className="gl-route"
    >
      <Label x={x0} y={cy + 4} px={x1 - x0 - 10} size={12} fill={INK}>
        {from}
      </Label>
      <circle cx={x1} cy={cy} r={4} fill="currentColor" />
      {to.map((t, i) => {
        const y = 14 + i * gap + 4;
        return (
          <g key={t + i}>
            <path
              d={`M${x1 + 4} ${cy} C${x1 + 22} ${cy} ${x2 - 20} ${y} ${x2} ${y}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
            />
            <Label x={x2 + 8} y={y + 4} px={width - x2 - 12} size={12}>
              {t}
            </Label>
          </g>
        );
      })}
    </Frame>
  );
}

/* --------------------------------------------------------------- ConceptCard */

/**
 * One idea as a tile: the object it is about, its name, a line saying what it is, and
 * where in the call it was said. Reach for this when the page has to open with the
 * handful of things the call was about, before any of them is argued.
 */
export function ConceptCard({
  icon,
  name,
  body,
  ts,
  pen = "neutral",
  width = 320,
}: {
  /** An object from the kit, without the `icon-` prefix. */
  icon: IconName;
  name: string;
  body?: string;
  /** Where it was said, as it appears in the transcript. */
  ts?: string;
  pen?: Pen;
  width?: number;
}) {
  const pad = 18;
  const inner = width - pad * 2;
  const H = 196;
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={name}
      desc={
        `A tile headed by a drawing of a ${icon.replace(/-/g, " ")}. It is named ${name}` +
        `${body ? `, and reads: ${body}` : ""}${ts ? `. Said at ${ts}` : ""}.`
      }
      className="gl-concept"
    >
      <rect
        x={0.7}
        y={0.7}
        width={width - 1.4}
        height={H - 1.4}
        rx={2}
        fill={PAPER_2}
        stroke={GRID}
        strokeWidth={1}
      />
      <Icon name={icon} size={46} x={pad} y={pad} />
      <Label x={pad} y={100} px={inner} size={17} lines={2} lead={21} weight={600} fill={INK}>
        {name}
      </Label>
      {body && (
        <Label x={pad} y={148} px={inner} size={13} lines={2} lead={17}>
          {body}
        </Label>
      )}
      {ts && (
        <text x={width - pad} y={H - 14} fontSize={13} textAnchor="end" fill={SOFT}>
          {ts}
        </text>
      )}
    </Frame>
  );
}

/* ------------------------------------------------------------------ Timeline */

export interface TimelineEvent {
  /** Minutes from the start of the call. */
  at: number;
  label: string;
}

/** Ruler steps that keep a span under about eight major ticks. */
function niceStep(span: number): number {
  for (const s of [1, 2, 5, 10, 15, 30, 60, 120]) if (span / s <= 8) return s;
  return Math.ceil(span / 8);
}

/**
 * Events on one axis, with a ruler in minutes beneath it. Reach for this when the order
 * and the spacing of what was said is the argument — when things clustered, or when a
 * decision came long after the evidence for it.
 */
export function Timeline({
  events,
  minutes,
  pen = "neutral",
  width = 1100,
}: {
  events: TimelineEvent[];
  /** The span the ruler covers. Defaults to the last event, rounded up. */
  minutes?: number;
  pen?: Pen;
  width?: number;
}) {
  const pad = 26;
  const run = width - pad * 2;
  const AXIS = 84;
  const RULE = 152;
  const H = 200;
  const last = events.reduce((m, e) => Math.max(m, e.at), 0);
  const step = niceStep(Math.max(1, minutes ?? last));
  const span = Math.max(step, minutes ?? Math.ceil(last / step) * step);
  const x = (at: number) => pad + (Math.max(0, Math.min(span, at)) / span) * run;
  // staggering halves the crowding, so each label is given a slot two events wide
  const slot = run / Math.max(1, Math.ceil(events.length / 2)) - 10;
  const ticks = Array.from({ length: Math.floor(span / step) + 1 }, (_, i) => i * step);
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={`${events.length} events over ${span} minutes`}
      desc={
        `One horizontal axis covering ${span} minutes, with a ruler beneath it. ` +
        `${events.length} events sit on it, labelled alternately above and below the axis: ` +
        `${events.map((e) => `${e.label} at ${e.at} minutes`).join(", ")}. ` +
        `Distance along the axis is elapsed time.`
      }
      className="gl-timeline"
    >
      <line x1={pad} y1={AXIS} x2={width - pad} y2={AXIS} stroke="currentColor" strokeWidth={1.4} />
      {events.map((e, i) => {
        const cx = x(e.at);
        const above = i % 2 === 0;
        // an event at either end would hang off the plate if it kept a centred label
        const edge = cx < pad + slot / 2 ? "start" : cx > width - pad - slot / 2 ? "end" : "middle";
        const lx = edge === "start" ? pad : edge === "end" ? width - pad : cx;
        return (
          <g key={e.label + i}>
            <line
              x1={cx}
              y1={above ? 38 : AXIS}
              x2={cx}
              y2={above ? AXIS : 106}
              stroke={GRID}
              strokeWidth={1}
            />
            <circle cx={cx} cy={AXIS} r={5} fill="currentColor" />
            <Label
              x={lx}
              y={above ? 30 : 120}
              px={slot}
              size={14}
              anchor={edge}
              fill={INK}
              weight={600}
            >
              {e.label}
            </Label>
          </g>
        );
      })}
      <line x1={pad} y1={RULE} x2={width - pad} y2={RULE} stroke={GRID} strokeWidth={1} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={RULE} x2={x(t)} y2={RULE + 7} stroke={GRID} strokeWidth={1} />
          <text
            x={x(t)}
            y={RULE + 24}
            fontSize={13}
            textAnchor={t === 0 ? "start" : t === span ? "end" : "middle"}
            fill={SOFT}
          >
            {t}
          </text>
        </g>
      ))}
      <text x={width / 2} y={RULE + 42} fontSize={13} textAnchor="middle" fill={SOFT}>
        minutes
      </text>
    </Frame>
  );
}

/* --------------------------------------------------------------------- Venn2 */

/**
 * Two sets and what they share. Reach for this when the point is overlap — how much of
 * one group is already inside the other, and what is left outside both.
 */
export function Venn2({
  leftName,
  rightName,
  left,
  right,
  both,
  pen = "neutral",
  width = 760,
}: {
  leftName: string;
  rightName: string;
  /** What sits in the left crescent only — a count or a short label. */
  left: string;
  /** What sits in the right crescent only. */
  right: string;
  /** What sits in the overlap. */
  both: string;
  pen?: Pen;
  width?: number;
}) {
  const H = 392;
  const r = Math.min(152, (width - 80) / 2.6);
  const cy = 216;
  const cxL = width / 2 - r * 0.58;
  const cxR = width / 2 + r * 0.58;
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={`${leftName} and ${rightName}, and the ${both} they share`}
      desc={
        `Two overlapping circles. The left one is ${leftName} and holds ${left} on its own; ` +
        `the right one is ${rightName} and holds ${right} on its own; the lens where they ` +
        `cross holds ${both}. Area is not to scale — only membership is.`
      }
      className="gl-venn"
    >
      <circle cx={cxL} cy={cy} r={r} fill="currentColor" fillOpacity={0.08} stroke="currentColor" strokeWidth={1.4} />
      <circle cx={cxR} cy={cy} r={r} fill={SOFT} fillOpacity={0.08} stroke={SOFT} strokeWidth={1.4} />
      <Label x={cxL} y={40} px={r * 1.6} size={15} anchor="middle" weight={600} fill={INK}>
        {leftName}
      </Label>
      <Label x={cxR} y={40} px={r * 1.6} size={15} anchor="middle" weight={600} fill={INK}>
        {rightName}
      </Label>
      {(
        [
          [cxL - r * 0.52, left],
          [width / 2, both],
          [cxR + r * 0.52, right],
        ] as [number, string][]
      ).map(([cx, text], i) => (
        <Label key={i} x={cx} y={cy + 6} px={r * 0.9} size={18} lines={2} lead={22} anchor="middle" fill={INK}>
          {text}
        </Label>
      ))}
    </Frame>
  );
}

/* ---------------------------------------------------------------- Matrix2x2 */

export interface MatrixItem {
  /** 0 at the left of the plot, 1 at the right. */
  x: number;
  /** 0 at the bottom, 1 at the top. */
  y: number;
  label?: string;
}

/**
 * Two axes crossed into four quadrants. Reach for this when the call sorted things by
 * two properties at once and the interesting claim is which corner something lands in.
 */
export function Matrix2x2({
  xAxis,
  yAxis,
  quadrants,
  items = [],
  pen = "neutral",
  width = 720,
}: {
  xAxis: string;
  yAxis: string;
  /** Top-left, top-right, bottom-left, bottom-right, in reading order. */
  quadrants: [string, string, string, string];
  items?: MatrixItem[];
  pen?: Pen;
  width?: number;
}) {
  const left = 58;
  const top = 18;
  const side = width - left - 22;
  const bottom = top + side;
  const H = bottom + 56;
  const mx = left + side / 2;
  const my = top + side / 2;
  const at = (i: MatrixItem) => ({
    cx: left + Math.max(0, Math.min(1, i.x)) * side,
    cy: bottom - Math.max(0, Math.min(1, i.y)) * side,
  });
  const corners: [number, number, string, "start" | "end"][] = [
    [left + 14, top + 30, quadrants[0], "start"],
    [left + side - 14, top + 30, quadrants[1], "end"],
    [left + 14, bottom - 16, quadrants[2], "start"],
    [left + side - 14, bottom - 16, quadrants[3], "end"],
  ];
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={`${quadrants.join(", ")} across ${xAxis} and ${yAxis}`}
      desc={
        `A square split into four quadrants by a vertical and a horizontal line. ` +
        `The horizontal axis is ${xAxis}, rising to the right; the vertical axis is ` +
        `${yAxis}, rising upward. Clockwise from the top left the quadrants are ` +
        `${quadrants.join(", ")}. ${items.length} items are placed as dots${
          items.length ? `: ${items.map((i) => i.label).filter(Boolean).join(", ")}` : ""
        }.`
      }
      className="gl-matrix"
    >
      <rect x={left} y={top} width={side} height={side} fill="none" stroke={GRID} strokeWidth={1} />
      <line x1={mx} y1={top} x2={mx} y2={bottom} stroke={GRID} strokeWidth={1} />
      <line x1={left} y1={my} x2={left + side} y2={my} stroke={GRID} strokeWidth={1} />
      {corners.map(([cx, cy, text, anchor], i) => (
        <Label key={i} x={cx} y={cy} px={side / 2 - 24} size={15} lines={2} lead={19} anchor={anchor} weight={600} fill={INK}>
          {text}
        </Label>
      ))}
      {items.map((item, i) => {
        const { cx, cy } = at(item);
        return (
          <g key={(item.label ?? "") + i}>
            <circle cx={cx} cy={cy} r={6} fill="currentColor" />
            {item.label && (
              <Label
                x={cx + (item.x > 0.62 ? -12 : 12)}
                y={cy + 5}
                px={side / 3}
                size={13}
                anchor={item.x > 0.62 ? "end" : "start"}
                fill={INK}
              >
                {item.label}
              </Label>
            )}
          </g>
        );
      })}
      <path
        d={`M${left} ${bottom + 18} H${left + side - 8} M${left + side - 8} ${bottom + 14} l8 4 l-8 4 z`}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.2}
      />
      <Label x={left} y={bottom + 40} px={side} size={14} weight={600} fill={INK}>
        {xAxis}
      </Label>
      <g transform={`rotate(-90 ${left - 34} ${my})`}>
        <path
          d={`M${left - 34 - side / 2} ${my} H${left - 34 + side / 2 - 8} M${left - 34 + side / 2 - 8} ${my - 4} l8 4 l-8 4 z`}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.2}
        />
        <Label x={left - 34 - side / 2} y={my - 10} px={side} size={14} weight={600} fill={INK}>
          {yAxis}
        </Label>
      </g>
    </Frame>
  );
}

/* --------------------------------------------------------------------- Stack */

/**
 * Layers in order, top to bottom. Reach for this when one thing sits on another — a
 * pipeline whose steps must run in order, or a hierarchy where each level depends on
 * the one beneath it.
 */
export function Stack({
  layers,
  arrows = false,
  pen = "neutral",
  width = 420,
}: {
  layers: string[];
  /** Draw an arrow between consecutive layers, for a pipeline rather than a hierarchy. */
  arrows?: boolean;
  pen?: Pen;
  width?: number;
}) {
  const bar = 48;
  const gap = arrows ? 30 : 14;
  const H = layers.length * bar + Math.max(0, layers.length - 1) * gap + 2;
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={layers.join(" → ")}
      desc={
        `${layers.length} layers stacked in order from the top: ${layers.join(", then ")}.` +
        (arrows ? " An arrow runs from each layer to the one beneath it." : "")
      }
      className="gl-stack"
    >
      {layers.map((layer, i) => {
        const y = 1 + i * (bar + gap);
        return (
          <g key={layer + i}>
            <rect
              x={0.7}
              y={y}
              width={width - 1.4}
              height={bar}
              rx={2}
              fill={PAPER_2}
              stroke="currentColor"
              strokeWidth={1.3}
            />
            <text x={16} y={y + bar / 2 + 5} fontSize={13} fill={SOFT}>
              {i + 1}
            </text>
            <Label
              x={width / 2}
              y={y + bar / 2 + 6}
              px={width - 72}
              size={15}
              anchor="middle"
              weight={600}
              fill={INK}
            >
              {layer}
            </Label>
            {arrows && i < layers.length - 1 && (
              <path
                d={`M${width / 2} ${y + bar + 4} v${gap - 16} M${width / 2 - 5} ${y + bar + gap - 12} l5 6 l5 -6 z`}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={1.2}
              />
            )}
          </g>
        );
      })}
    </Frame>
  );
}

/* ---------------------------------------------------------------------- Ring */

/**
 * One share of one whole, as a ring. Reach for this when a single proportion is the
 * finding and a bar beside nothing would be a bar beside nothing.
 */
export function Ring({
  value,
  display,
  caption,
  pen = "neutral",
  width = 240,
}: {
  /** The share, 0 to 1. */
  value: number;
  /** What to print in the middle. Defaults to the share as a percentage. */
  display?: string;
  caption?: string;
  pen?: Pen;
  width?: number;
}) {
  const share = Math.max(0, Math.min(1, value));
  const cx = width / 2;
  const r = width / 2 - 28;
  const circumference = 2 * Math.PI * r;
  const lines = caption ? wrap(caption, width - 8, 13, 2).length : 0;
  const H = width + (lines ? lines * 18 + 8 : 0);
  const shown = display ?? `${Math.round(share * 100)}%`;
  return (
    <Frame
      w={width}
      h={H}
      pen={pen}
      title={`${shown}${caption ? ` — ${caption}` : ""}`}
      desc={
        `A ring standing for one whole. ${shown} of it is drawn in the pen colour and the ` +
        `remainder is left as a hairline track${caption ? `. ${caption}` : ""}.`
      }
      className="gl-ring"
    >
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={GRID} strokeWidth={18} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={18}
        strokeDasharray={`${(circumference * share).toFixed(1)} ${circumference.toFixed(1)}`}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text
        x={cx}
        y={cx + 12}
        fontSize={36}
        textAnchor="middle"
        fontWeight={600}
        fill={INK}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {fit(shown, r * 1.7, 36)}
      </text>
      {caption && (
        <Label x={cx} y={width + 14} px={width - 8} size={13} lines={2} lead={18} anchor="middle">
          {caption}
        </Label>
      )}
    </Frame>
  );
}
