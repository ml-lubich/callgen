import { Collapsible } from "../components/Collapsible";
import { Reveal, STAGGER } from "../components/Reveal";
import { Skeleton } from "../components/Skeleton";
import { TimeLink } from "../components/TimeLink";
import { Icon, type IconName, IconSprite } from "../glyphs/icons";
import { leadSplit } from "./Abstract";
import type { Insight, Turn } from "../types";

export function InsightsSkeleton() {
  return (
    <div className="sk-grid">
      <Skeleton h={40} w="80%" />
      <Skeleton h={24} w="60%" />
      <Skeleton h={40} w="74%" />
    </div>
  );
}

/**
 * Words that name each object in the kit. An insight picks the drawing whose words it
 * uses first: the text is scanned once, left to right, and the earliest match wins, so
 * the noun the claim opens on is the noun that gets drawn. A reader can predict the
 * choice by reading the claim and looking for the first word in this table.
 *
 * Order here only breaks a tie between two words starting at the same place, which the
 * word boundaries make near-impossible. Nothing here is random and nothing depends on
 * where the insight sits in the list.
 */
const ICON_WORDS: [IconName, RegExp][] = [
  ["alert", /\b(alert|risk|risky|warn|warning|fail|fails|failed|failure|failures|broken)\b/],
  ["ticket", /\b(ticket|tickets|bug|bugs|issue|issues|incident)\b/],
  ["team", /\b(team|teams|support|staff|people|headcount)\b/],
  ["person", /\b(person|customer|customers|user|users|candidate|account|accounts)\b/],
  ["coin", /\b(cost|costs|costly|price|pricing|revenue|budget|spend|money|paid|pay|charge|charges)\b/],
  ["clock", /\b(clock|time|times|minute|minutes|hour|hours|delay|deadline|nightly|daily|overnight)\b/],
  ["fork-in-road", /\b(choice|choices|decide|decides|decision|option|options|either|tradeoff|trade-off)\b/],
  [
    "database",
    /\b(database|row|rows|table|tables|schema|column|columns|record|records|import|imports|imported|ingest|sync|syncs)\b/,
  ],
  ["document", /\b(file|files|document|documents|report|reports|spec|specs|export|exports)\b/],
  ["filter", /\b(filter|filters|screen|screens|screening|reject|rejects|rejection|exclude|discard)\b/],
  ["gate", /\b(gate|gates|approval|approve|permission|permissions|block|blocks|blocked)\b/],
  ["check", /\b(check|checks|agree|agreed|agreement|confirm|confirmed|resolved|validator|validate|validation)\b/],
  ["chart-up", /\b(chart|growth|grow|increase|trend|metric|metrics|volume)\b/],
  ["shield", /\b(shield|security|secure|protect|safety|compliance|privacy)\b/],
  ["robot", /\b(robot|ai|model|models|automation|automated|automatic)\b/],
  ["search", /\b(search|find|finds|discover|investigate|audit)\b/],
  ["api", /\b(api|apis|endpoint|endpoints|integration|integrations|webhook)\b/],
  ["server", /\b(server|servers|infrastructure|deploy|deployment|hosting)\b/],
  ["cloud", /\b(cloud|saas|hosted|tenant|tenants)\b/],
  ["gear", /\b(config|configuration|setting|settings|engineering|pipeline|system|systems)\b/],
  ["link", /\b(link|links|depend|depends|dependency|coupled|connect|connects)\b/],
  ["branch", /\b(branch|branches|fork|variant|variants|version|versions)\b/],
  ["tag", /\b(tag|tags|label|labels|category|categories)\b/],
  ["inbox", /\b(inbox|queue|queues|backlog|batch|batches)\b/],
  ["terminal", /\b(terminal|script|scripts|command|commands|cli)\b/],
  ["building", /\b(building|office|company|companies|org|organisation|organization|vendor)\b/],
  ["laptop", /\b(laptop|desktop|browser|client)\b/],
  ["image", /\b(image|images|screenshot|screenshots|photo|photos)\b/],
  ["vector-index", /\b(embedding|embeddings|vector|vectors|index|retrieval)\b/],
];

/** The neutral drawing, used when an insight names none of the objects above. */
const FALLBACK: IconName = "document-stack";

/** The object this insight is about, from its own words. See {@link ICON_WORDS}. */
export function iconFor(ins: Insight): IconName {
  const text = `${ins.title ?? ""} ${ins.claim}`.toLowerCase();
  let best = FALLBACK;
  let at = Infinity;
  for (const [name, re] of ICON_WORDS) {
    const m = re.exec(text);
    if (m && m.index < at) {
      at = m.index;
      best = name;
    }
  }
  return best;
}

/** The so-what, with its first sentence as the lead line the eye lands on. */
function Implication({ text }: { text: string }) {
  const [lead, rest] = leadSplit(text);
  return (
    <>
      <span className="lead">{lead}</span>
      {rest && ` ${rest}`}
    </>
  );
}

/**
 * One idea as a tile: the object it is about, its name, the claim in a line, and how
 * far the tape backs it. Everything that argues the claim — the observations, the
 * so-what, what the confidence rests on — waits behind the disclosure, so a reader
 * takes in four ideas before reading one of them.
 */
function Card({ ins, turns }: { ins: Insight; turns: Turn[] }) {
  return (
    <>
      <span className="insight-icon" aria-hidden="true">
        <Icon name={iconFor(ins)} size={34} />
      </span>
      {/* the title is the heading when the analysis wrote one; without it the claim
          is the headline it always was */}
      <p className="insight-claim">{ins.title || ins.claim}</p>
      {ins.title && <p className="insight-idea">{ins.claim}</p>}
      <p className={`insight-confidence conf-${ins.confidence}`}>
        <span className="conf-dot" aria-hidden="true" />
        {ins.confidence} confidence
      </p>
      <Collapsible
        label="Why this holds"
        meta={`${ins.supports.length} ${ins.supports.length === 1 ? "support" : "supports"}`}
      >
        <ul className="insight-supports">
          {ins.supports.map((s, j) => (
            <li key={`${s.s}-${j}`}>
              <TimeLink ts={s.ts} s={s.s} turns={turns} />
              <span>{s.observation}</span>
            </li>
          ))}
        </ul>
        <p className="insight-implication">
          <b>So what</b>
          <Implication text={ins.implication} />
        </p>
        {ins.basis ? <p className="insight-basis">{ins.basis}</p> : null}
      </Collapsible>
    </>
  );
}

/**
 * The claims the call earns only when its observations are read together, as a grid of
 * tiles. Insights arrive already ranked, so the first one leads: it spans the grid and
 * sets its claim a step larger. Nothing is re-sorted here.
 */
export function Insights({ insights, turns }: { insights: Insight[]; turns: Turn[] }) {
  return (
    <>
      <IconSprite />
      <ol className="insight-cards">
        {insights.map((ins, i) => (
          <Reveal
            as="li"
            className={`insight-card${i === 0 ? " insight-lead" : ""}`}
            key={ins.claim}
            delay={i * STAGGER}
          >
            <Card ins={ins} turns={turns} />
          </Reveal>
        ))}
      </ol>
    </>
  );
}
