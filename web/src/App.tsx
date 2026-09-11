import {
  Fragment,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useOnceInView } from "./lib/inview";
import { Reveal, STAGGER } from "./components/Reveal";
import { Skeleton, SkeletonLines } from "./components/Skeleton";
import { shapeOf } from "./lib/mode";
import { Collapsible } from "./components/Collapsible";
import { Abstract, AbstractSkeleton, firstSentence } from "./sections/Abstract";
import { Acts, ActsSkeleton } from "./sections/Acts";
import { Evidence, EvidenceSkeleton } from "./sections/Evidence";
import { Figures, FiguresSkeleton } from "./sections/Figures";
import { Fit } from "./sections/Fit";
import { Friction } from "./sections/Friction";
import { Insights, InsightsSkeleton } from "./sections/Insights";
import { Lands } from "./sections/Lands";
import { Named, NamedSkeleton } from "./sections/Named";
import { Next } from "./sections/Next";
import { Numbers } from "./sections/Numbers";
import { Plate } from "./sections/Plate";
import { Quotes, QuotesSkeleton } from "./sections/Quotes";
import { Sec } from "./sections/Sec";
import { RowsSkeleton, Signals } from "./sections/Signals";
import { StripChart, StripChartSkeleton } from "./sections/StripChart";
import { Threads, ThreadsSkeleton } from "./sections/Threads";
import { Transcript } from "./sections/Transcript";
import { Verdict, VerdictSkeleton } from "./sections/Verdict";
import type { Deck, Tier } from "./types";

const CallTerrain = lazy(() => import("./scenes/CallTerrain"));

/**
 * The one 3D moment on the page, kept out of the way of the first paint: nothing of
 * three.js runs until the reader is nearly at it.
 */
function Terrain({ deck }: { deck: Deck }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useOnceInView(ref, "300px 0px 300px 0px");
  return (
    <div ref={ref}>
      {near && (
        <Suspense
          fallback={
            <div className="terrain">
              <Skeleton h={300} />
            </div>
          }
        >
          <CallTerrain deck={deck} />
        </Suspense>
      )}
    </div>
  );
}

interface Block {
  title?: string;
  className?: string;
  /** Row count shown on the folded header when the mode collapses this section. */
  count?: number;
  when: boolean;
  skeleton: ReactNode;
  body: ReactNode;
}

/**
 * Every section the page can draw, keyed by the id `src/callgen/modes.py` uses. The
 * mode decides which of these appear and in what order; a section the analysis had
 * nothing for is dropped whatever the mode says, rather than left as an empty heading.
 *
 * Two blocks are not the mode's to move. The verdict is the abstract's first line and
 * travels with it; where the call lands is the acts' conclusion and travels with them.
 */
function blocks(deck: Deck, figureCap?: number): Record<string, Block> {
  const c = deck.content;
  const turns = deck.turns;
  const shape = shapeOf(c);

  return {
    strip: {
      className: "chart-sec",
      when: true,
      skeleton: <StripChartSkeleton />,
      body: <StripChart deck={deck} terrain={<Terrain deck={deck} />} />,
    },
    abstract: {
      title: "Abstract",
      when: Boolean(c.abstract || c.verdict),
      skeleton: c.verdict ? <VerdictSkeleton /> : <AbstractSkeleton />,
      body: (
        <>
          {c.verdict && <Verdict verdict={c.verdict} />}
          {c.abstract && <Abstract text={c.abstract} />}
        </>
      ),
    },
    insights: {
      title: "Insights",
      when: (c.insights ?? []).length > 0,
      skeleton: <InsightsSkeleton />,
      body: <Insights insights={c.insights!} turns={turns} />,
    },
    highlights: {
      title: "Highlights",
      when: (c.highlights ?? []).length > 0,
      skeleton: <SkeletonLines n={4} />,
      body: (
        <ul className="bullets narrow">
          {(c.highlights ?? []).map((h, i) => (
            <Reveal as="li" key={h} delay={i * STAGGER}>
              {h}
            </Reveal>
          ))}
        </ul>
      ),
    },
    figures: {
      title: "Diagrams",
      when: Boolean(deck.diagrams.trim()),
      skeleton: <FiguresSkeleton />,
      body: <Figures fragment={deck.diagrams} cap={figureCap} />,
    },
    acts: {
      title: "Acts",
      when: (c.acts ?? []).length > 0,
      skeleton: <ActsSkeleton />,
      body: (
        <>
          <Acts acts={c.acts} duration={deck.duration} turns={turns} />
          {(c.lands ?? []).length > 0 && (
            <div className="lands-block">
              <h3 className="subhead">Where it lands</h3>
              <Lands lands={c.lands!} turns={turns} />
            </div>
          )}
        </>
      ),
    },
    threads: {
      title: "Threads",
      when: (c.threads ?? []).length > 0,
      skeleton: <ThreadsSkeleton />,
      body: <Threads threads={c.threads!} duration={deck.duration} turns={turns} />,
    },
    evidence: {
      title: "Evidence",
      count: (c.evidence ?? []).length,
      when: (c.evidence ?? []).length > 0,
      skeleton: <EvidenceSkeleton />,
      body: <Evidence rows={c.evidence!} turns={turns} />,
    },
    signals: {
      title: "Signals",
      count: (c.signals ?? []).length,
      when: (c.signals ?? []).length > 0,
      skeleton: <RowsSkeleton n={4} />,
      body: <Signals rows={c.signals!} turns={turns} />,
    },
    numbers: {
      title: "Numbers",
      count: (c.numbers ?? []).length,
      when: (c.numbers ?? []).length > 0,
      skeleton: <RowsSkeleton n={3} />,
      body: <Numbers rows={c.numbers!} turns={turns} />,
    },
    tech: {
      title: "Named in the call",
      count: (c.tech ?? []).length,
      when: (c.tech ?? []).length > 0,
      skeleton: <NamedSkeleton />,
      body: <Named tech={c.tech!} />,
    },
    friction: {
      title: "Friction",
      count: (c.tensions ?? []).length + (c.diarization ?? []).length,
      when: (c.tensions ?? []).length > 0 || (c.diarization ?? []).length > 0,
      skeleton: <RowsSkeleton />,
      body: <Friction tensions={c.tensions} diarization={c.diarization} turns={turns} />,
    },
    quotes: {
      title: "Quotes",
      when: (c.quotes ?? []).length > 0,
      skeleton: <QuotesSkeleton />,
      body: <Quotes quotes={c.quotes!} deck={deck} turns={turns} />,
    },
    fit: {
      title: "Fit",
      when:
        (c.fit?.aligned_on ?? []).length +
          (c.fit?.unresolved ?? []).length +
          (c.fit?.risks ?? []).length >
        0,
      skeleton: <SkeletonLines n={5} />,
      body: <Fit fit={c.fit!} />,
    },
    next: {
      title: "Next",
      when: (c.next_steps ?? []).length > 0,
      skeleton: <RowsSkeleton />,
      body: <Next steps={c.next_steps!} turns={turns} />,
    },
    transcript: {
      title: "Transcript",
      when: turns.length > 0,
      skeleton: <RowsSkeleton n={2} />,
      body: <Transcript deck={deck} mode={shape.transcript} />,
    },
  };
}

/**
 * Signals and numbers are two lists of the same shape and sit side by side when the mode
 * asks for both in a row. Everything else is one section per block.
 */
function pairUp(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] === "signals" && ids[i + 1] === "numbers") {
      out.push(["signals", "numbers"]);
      i++;
    } else out.push([ids[i]]);
  }
  return out;
}

/**
 * A section the mode folds. The body is identical; only its default visibility changes,
 * so a reader who wants the 26 rows gets the 26 rows, and one who does not is not
 * handed a wall of text between two figures.
 */
function fold(folded: boolean, label: string, count: number | undefined, body: ReactNode) {
  if (!folded) return body;
  return (
    <Collapsible label={`Show ${label.toLowerCase()}`} meta={count ? `${count} rows` : undefined}>
      {body}
    </Collapsible>
  );
}


/** How tall the sticky tier nav is; the page scrolls anchors clear of it by the same. */
const NAV_H = 44;

/** A tier and the first section it actually opens, numbered in the order it is read. */
interface Band {
  tier: Tier;
  at: string;
  n: number;
}

/**
 * The band that opens a tier: an ordinal, the tier's name set large, and one line saying
 * what the reader is about to get. It is the page's only structural heading — the
 * sections under it keep their rail-and-body spread unchanged.
 */
function TierBand({ tier, n }: { tier: Tier; n: number }) {
  return (
    <div className="tier-band" id={`tier-${tier.id}`} data-tier={tier.id}>
      <div className="wrap">
        <span className="tier-n" aria-hidden="true">
          {String(n).padStart(2, "0")}
        </span>
        <h2 className="tier-label">{tier.label}</h2>
        <p className="tier-lede">{tier.lede}</p>
      </div>
    </div>
  );
}

/**
 * Which tier the reader is in. One observer over the bands, in the same fail-open spirit
 * as lib/inview.ts: no IntersectionObserver — a print run, a screenshot renderer — leaves
 * the first tier marked and every link on the bar still working.
 */
function useActiveTier(key: string): string | null {
  const [active, setActive] = useState<string | null>(() => (key ? key.split("|")[0] : null));

  useEffect(() => {
    const ids = key ? key.split("|") : [];
    if (!ids.length || typeof IntersectionObserver === "undefined") return;
    const els = ids.map((id) => document.getElementById(`tier-${id}`));
    // The tier in play is the last band the reader has scrolled past, which is a
    // question about all the bands at once rather than about the one that just moved.
    const pick = () => {
      let now = ids[0];
      els.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= NAV_H + 1) now = ids[i];
      });
      setActive(now);
    };
    const io = new IntersectionObserver(pick, {
      rootMargin: `-${NAV_H}px 0px 0px 0px`,
      threshold: [0, 1],
    });
    els.forEach((el) => el && io.observe(el));
    pick();
    return () => io.disconnect();
  }, [key]);

  return active;
}

/**
 * The tiers as one slim sticky bar. It is a convenience, not the structure — under 760px
 * the bands themselves do the work and the bar is gone, and a page with a single tier has
 * nothing to navigate between.
 */
function TierNav({ bands }: { bands: Band[] }) {
  const active = useActiveTier(bands.map((b) => b.tier.id).join("|"));
  if (bands.length < 2) return null;
  return (
    <nav className="tier-nav" aria-label="Tiers">
      <div className="wrap">
        {bands.map((b) => (
          <a
            key={b.tier.id}
            href={`#tier-${b.tier.id}`}
            className={b.tier.id === active ? "on" : undefined}
            aria-current={b.tier.id === active ? "true" : undefined}
          >
            {b.tier.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

/**
 * The top of the page in one screen: the stance the analysis took, the four or five
 * numbers that size the call, and the two claims it turns on. Every value here is already
 * on the page further down — this is the same reading, compressed to seconds.
 */
function Snapshot({ deck }: { deck: Deck }) {
  const c = deck.content;
  const meta = c.meta;
  // The verdict is the finding; without one the abstract's opening sentence is the
  // nearest thing the analysis committed to.
  const position = c.verdict?.position || (c.abstract ? firstSentence(c.abstract) : "");
  const num = (n: number) => n.toLocaleString();
  const stats = (
    [
      ["Duration", meta.duration_label || `${Math.max(1, Math.round(deck.duration / 60))} min`],
      ["Turns", num(meta.turns ?? deck.metrics.turns ?? deck.turns.length)],
      ["Words", num(meta.words ?? 0)],
      ["Speakers", Object.keys(deck.metrics.speakers ?? {}).length || meta.participants.length],
      ["Next steps", (c.next_steps ?? []).length],
      ["Claims", (c.insights ?? []).length],
      ["Threads", (c.threads ?? []).length],
    ] as [string, string | number][]
  ).filter(([, v]) => v !== 0 && v !== "0" && v !== "" && v != null);
  // The plate's metastrip already carries whatever the pipeline wrote into meta. A tile
  // repeating a cell from 300px up the page is the noise this block exists to cut — so a
  // stat is "already on the plate" when its value matches one shown there, whatever label
  // the plate used (Attendees vs. Speakers is the same count read twice). Fewer than three
  // survivors is worse than none: a two-tile row still reads like it forgot the plate, so
  // the verdict and insights carry the snapshot alone instead.
  const fmt = (v: string | number) => (typeof v === "number" ? num(v) : v);
  const onPlate = new Set(
    [meta.duration_label, meta.turns, meta.words, ...(meta.extra ?? []).map(([, v]) => v)]
      .filter((v): v is string | number => v !== "" && v != null)
      .map(fmt),
  );
  const fresh = stats.filter(([, value]) => !onPlate.has(fmt(value)));
  const tiles = fresh.length >= 3 ? fresh.slice(0, 5) : [];
  const top = (c.insights ?? []).slice(0, 2);

  return (
    <div className="snapshot">
      <div className="wrap">
        {position && <p className="snap-position">{position}</p>}
        <dl className="snap-tiles">
          {tiles.map(([label, value]) => (
            <div className="snap-tile" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {top.length > 0 && (
          <ul className="snap-insights">
            {top.map((ins) => (
              <li key={ins.claim}>{ins.title || ins.claim}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function App({ deck }: { deck: Deck }) {
  const shape = useMemo(() => shapeOf(deck.content), [deck.content]);
  const all = useMemo(() => blocks(deck, shape.figures), [deck, shape.figures]);

  const rows = pairUp(shape.sections.filter((id) => all[id]?.when));

  // A tier opens at the first section it names that the page is actually drawing, so a
  // tier whose sections all fell away is never a heading to nothing. The record tier is
  // what used to be the appendix divider: the point the read ends and the record begins.
  const drawn = new Set(rows.flat());
  const bands: Band[] = shape.tiers
    .flatMap((tier) => {
      const at = tier.sections.find((id) => drawn.has(id));
      return at ? [{ tier, at }] : [];
    })
    .map((b, i) => ({ ...b, n: i + 1 }));
  const bandAt = new Map(bands.map((b) => [b.at, b]));

  return (
    <main>
      <Plate deck={deck} />
      <TierNav bands={bands} />
      {rows.map((row, order) => {
        const band = row.map((id) => bandAt.get(id)).find(Boolean);
        const divider = band ? (
          <Fragment key={`tier-${band.tier.id}`}>
            <TierBand tier={band.tier} n={band.n} />
            {band.tier.id === "overview" && <Snapshot deck={deck} />}
          </Fragment>
        ) : null;
        if (row.length === 2) {
          const [a, b] = row.map((id) => all[id]);
          return (
            <Fragment key={row.join("-")}>
              {divider}
              <Sec
                order={order + 1}
                title="Signals & numbers"
                skeleton={<RowsSkeleton n={4} />}
              >
                {fold(
                  row.every((id) => shape.collapsed.includes(id)),
                  "Signals and numbers",
                  (a.count ?? 0) + (b.count ?? 0),
                  <div className="twoup">
                    <div>
                      <h3 className="subhead">{a.title}</h3>
                      {a.body}
                    </div>
                    <div>
                      <h3 className="subhead">{b.title}</h3>
                      {b.body}
                    </div>
                  </div>,
                )}
              </Sec>
            </Fragment>
          );
        }
        const block = all[row[0]];
        return (
          <Fragment key={row[0]}>
            {divider}
            <Sec
              id={`sec-${row[0]}`}
              order={order + 1}
              title={block.title}
              className={block.className}
              skeleton={block.skeleton}
            >
              {fold(
                shape.collapsed.includes(row[0]),
                block.title ?? row[0],
                block.count,
                block.body,
              )}
            </Sec>
          </Fragment>
        );
      })}
      <p className="colophon">
        Callgen · one file, every timestamp links to the turn it came from.
      </p>
    </main>
  );
}
