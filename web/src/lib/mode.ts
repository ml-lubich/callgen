import type { Content, ModeBlock, Tier, TierId } from "../types";

/**
 * The output mode, as `src/callgen/modes.py` wrote it into content.json. A mode
 * decides three things and nothing else: which sections appear and in what order, how
 * the transcript is shown, and how many figures survive. It never decides what is true,
 * so nothing here edits a fact — it only drops and reorders whole sections.
 */

export type TranscriptMode = "open" | "collapsed" | "omit";

export type { ModeBlock, Tier, TierId };

/** Every section the page can draw, in the order it draws them when no mode says otherwise. */
export const DEFAULT_SECTIONS = [
  "strip",
  "abstract",
  "highlights",
  "insights",
  "figures",
  "acts",
  "threads",
  "next",
  "evidence",
  "signals",
  "numbers",
  "tech",
  "friction",
  "quotes",
  "fit",
  "transcript",
] as const;

/**
 * The five tiers the page reads in, in order: what happened, what it means, what was
 * discussed, what to do, and the record behind all of it. The pipeline names them in
 * `_mode.tiers`; these are what the page falls back to when it does not.
 */
const TIER_DEFAULTS: readonly { id: TierId; label: string; lede: string }[] = [
  {
    id: "overview",
    label: "Overview",
    lede: "The finding, and the shape of the call in one screen.",
  },
  {
    id: "concepts",
    label: "Main concepts",
    lede: "The claims the call earns once its observations are read together.",
  },
  {
    id: "discussion",
    label: "What was discussed",
    lede: "The call in the order it happened, and the threads that ran across it.",
  },
  {
    id: "actions",
    label: "Action steps",
    lede: "What was committed to, by whom, and at which second it was said.",
  },
  {
    id: "record",
    label: "The record",
    lede:
      "Every claim, signal, number and the transcript. Folded by default; open what you " +
      "want to check.",
  },
];

/** Which tier each section belongs to when the pipeline sends no tiers of its own. */
export const TIER_OF: Record<string, TierId> = {
  strip: "overview",
  abstract: "overview",
  highlights: "overview",
  insights: "concepts",
  figures: "concepts",
  acts: "discussion",
  threads: "discussion",
  next: "actions",
  evidence: "record",
  signals: "record",
  numbers: "record",
  tech: "record",
  friction: "record",
  quotes: "record",
  fit: "record",
  transcript: "record",
};

/**
 * The mode this build was rendered for, as the CLI passed it through the environment and
 * index.html stamped on <html>. It is a label: the shape itself comes from content.json's
 * _mode block, which knows the sections, and that block wins wherever both have a name.
 */
export function buildMode(): string | null {
  if (typeof document === "undefined") return null;
  return document.documentElement.getAttribute("data-mode") || null;
}

export interface Shape {
  name: string;
  sections: string[];
  transcript: TranscriptMode;
  /** undefined means no cap. */
  figures?: number;
  /** Section ids the page renders collapsed by default. */
  collapsed: string[];
  /** Section ids rendered after the appendix divider — the record, folded out of the read. */
  appendix: string[];
  /** The reading tiers, in order, each carrying the sections it opens. */
  tiers: Tier[];
}

/** Group the rendered sections into the five default tiers, dropping the empty ones. */
function synthesise(sections: string[]): Tier[] {
  return TIER_DEFAULTS.map((t) => ({
    ...t,
    sections: sections.filter((s) => TIER_OF[s] === t.id),
  })).filter((t) => t.sections.length > 0);
}

/**
 * The shape the page should take. Unknown section ids are dropped rather than trusted,
 * so a mode from a newer pipeline cannot make this page render an empty heading.
 */
export function shapeOf(content: Pick<Content, "_mode">): Shape {
  const block = content._mode ?? {};
  const known = new Set<string>(DEFAULT_SECTIONS);
  const asked = Array.isArray(block.sections) ? block.sections.filter((s) => known.has(s)) : null;
  const transcript: TranscriptMode =
    block.transcript === "open" || block.transcript === "omit" ? block.transcript : "collapsed";

  const sections = (asked?.length ? asked : [...DEFAULT_SECTIONS]).filter(
    (s) => s !== "transcript",
  );
  if (transcript !== "omit") sections.push("transcript");

  const collapsed = Array.isArray(block.collapsed)
    ? block.collapsed.filter((s) => known.has(s))
    : [];
  // The appendix is only meaningful for sections the page is actually rendering; a mode
  // that names an appendix section it dropped does not get a divider to nowhere.
  const inOrder = new Set(sections);
  const appendix = Array.isArray(block.appendix)
    ? block.appendix.filter((s) => known.has(s) && inOrder.has(s))
    : [];

  // A tier is dropped the same way a section is: unknown ids are not trusted, sections
  // this page is not rendering are struck out, and a tier left with nothing to open is
  // not a heading the reader should see. An older content.json carries no tiers at all,
  // and gets the built-in five rather than losing the page's hierarchy.
  const named = Array.isArray(block.tiers)
    ? block.tiers
        .map((t) => TIER_DEFAULTS.find((d) => d.id === t?.id) && t)
        .filter((t): t is Tier => Boolean(t))
        .map((t) => {
          const fallback = TIER_DEFAULTS.find((d) => d.id === t.id)!;
          return {
            id: t.id,
            label: t.label || fallback.label,
            lede: t.lede || fallback.lede,
            sections: (Array.isArray(t.sections) ? t.sections : []).filter((s) => inOrder.has(s)),
          };
        })
        .filter((t) => t.sections.length > 0)
    : [];

  return {
    name: block.name || buildMode() || "professional",
    sections,
    transcript,
    collapsed,
    appendix,
    tiers: named.length ? named : synthesise(sections),
    figures: typeof block.figures === "number" && block.figures >= 0 ? block.figures : undefined,
  };
}
