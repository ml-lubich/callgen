import { Reveal, STAGGER } from "../components/Reveal";
import { Skeleton } from "../components/Skeleton";
import { TimeLink } from "../components/TimeLink";
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
 * The claims the call earns only when its observations are read together. Each is a
 * headline the reader could not have guessed from the job title, set large; under it
 * the observations that carry it, each linking to the second it was said; and the
 * so-what pulled out, with a confidence that says how far the tape backs the claim.
 */
export function Insights({ insights, turns }: { insights: Insight[]; turns: Turn[] }) {
  return (
    <ol className="insights">
      {insights.map((ins, i) => (
        <Reveal as="li" className="insight" key={ins.claim} delay={i * STAGGER}>
          <p className="insight-claim">{ins.claim}</p>
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
            {ins.implication}
          </p>
          <p className={`insight-confidence conf-${ins.confidence}`}>
            <span className="conf-dot" aria-hidden="true" />
            {ins.confidence} confidence
            {ins.basis ? <span className="conf-basis"> · {ins.basis}</span> : null}
          </p>
        </Reveal>
      ))}
    </ol>
  );
}
