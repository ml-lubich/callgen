import { Reveal } from "../components/Reveal";
import { SkeletonLines } from "../components/Skeleton";

export function AbstractSkeleton() {
  return <SkeletonLines n={4} w="66ch" />;
}

/**
 * A paragraph split into its first sentence and the rest.
 *
 * Long prose on this page gets a lead line rather than an even grey block: the first
 * sentence is set a step larger, so the eye has somewhere to land before it commits to
 * reading. Text with no sentence break comes back whole and is simply set as the lead.
 */
export function leadSplit(text: string): [string, string] {
  const lead = text.match(/^[\s\S]*?[.!?](?=\s|$)/);
  if (!lead) return [text.trim(), ""];
  return [lead[0], text.slice(lead[0].length).trim()];
}

/** The first sentence of a paragraph — the standing-in headline when nothing better exists. */
export function firstSentence(text: string): string {
  return leadSplit(text.split(/\n\s*\n/)[0] ?? "")[0];
}

export function Abstract({ text }: { text: string }) {
  // The writer splits the abstract into paragraphs of at most 70 words with a blank
  // line between them; a single <p> would undo that and hand the reader a wall.
  const paragraphs = text.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  const [lead, rest] = leadSplit(paragraphs[0] ?? "");
  return (
    <Reveal className="narrow abstract">
      <p>
        <span className="lead">{lead}</span>
        {rest && ` ${rest}`}
      </p>
      {paragraphs.slice(1).map((t, i) => (
        <p key={i}>{t}</p>
      ))}
    </Reveal>
  );
}
