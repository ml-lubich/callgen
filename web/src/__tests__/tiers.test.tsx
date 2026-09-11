import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { deck } from "../lib/deck";
import { shapeOf } from "../lib/mode";
import type { Content } from "../types";
import { CONTENT, METRICS, TURNS } from "./fixture";

/**
 * The page reads in five tiers — overview, main concepts, what was discussed, action
 * steps, the record — and each opens with a band rather than the page running on as one
 * flat column. The pipeline names the tiers; a content.json written before it did gets
 * the same five synthesised from the sections it is rendering.
 */

const INSIGHTS: NonNullable<Content["insights"]> = [
  {
    claim: "The screen would have rejected the strongest signal on the call.",
    implication: "Hire on the delivery axis.",
    confidence: "high",
    supports: [{ ts: "00:00:40", s: 40, observation: "he said so" }],
  },
  {
    claim: "The second claim, ranked under the first.",
    implication: "Watch the handoff.",
    confidence: "medium",
    supports: [{ ts: "00:00:40", s: 40, observation: "and again" }],
  },
  {
    claim: "A third claim the overview has no room for.",
    implication: "Nothing yet.",
    confidence: "low",
    supports: [{ ts: "00:00:00", s: 0, observation: "in passing" }],
  },
];

const FULL: Content = {
  ...CONTENT,
  insights: INSIGHTS,
  signals: [{ ts: "00:00:00", s: 0, signal: "agreement" }],
  next_steps: [{ ts: "00:01:20", s: 80, commitment: "send the deck" }],
};

function page(content: Content, mode?: Content["_mode"]) {
  render(<App deck={deck({ ...content, _mode: mode }, TURNS, METRICS, "")} />);
}

function bands() {
  return [...document.querySelectorAll(".tier-band")].map((b) => ({
    id: b.getAttribute("data-tier"),
    n: b.querySelector(".tier-n")?.textContent,
    label: b.querySelector(".tier-label")?.textContent,
    lede: b.querySelector(".tier-lede")?.textContent,
  }));
}

describe("the tiers a mode asks for", () => {
  it("synthesises the five tiers when the mode block carries none", () => {
    const tiers = shapeOf({}).tiers;
    expect(tiers.map((t) => t.id)).toEqual([
      "overview",
      "concepts",
      "discussion",
      "actions",
      "record",
    ]);
    expect(tiers[0].sections).toEqual(["strip", "abstract", "highlights"]);
    expect(tiers[1].sections).toEqual(["insights", "figures"]);
    expect(tiers[3].sections).toEqual(["next"]);
    expect(tiers[4].sections).toContain("transcript");
    expect(tiers.every((t) => t.label && t.lede)).toBe(true);
  });

  it("synthesises only the tiers the mode left something in", () => {
    const tiers = shapeOf({ _mode: { sections: ["abstract", "signals"], transcript: "omit" } }).tiers;
    expect(tiers.map((t) => t.id)).toEqual(["overview", "record"]);
    expect(tiers[0].sections).toEqual(["abstract"]);
  });

  it("honours the tiers the mode names, label and lede included", () => {
    const tiers = shapeOf({
      _mode: {
        sections: ["abstract", "signals"],
        transcript: "omit",
        tiers: [
          { id: "overview", label: "The gist", lede: "One screen.", sections: ["abstract"] },
          { id: "record", label: "Everything else", lede: "The tape.", sections: ["signals"] },
        ],
      },
    }).tiers;
    expect(tiers.map((t) => t.label)).toEqual(["The gist", "Everything else"]);
    expect(tiers[0].lede).toBe("One screen.");
  });

  it("drops a tier id it has never heard of, and sections the page is not rendering", () => {
    const tiers = shapeOf({
      _mode: {
        sections: ["abstract"],
        transcript: "omit",
        tiers: [
          { id: "overview", label: "Overview", lede: "x", sections: ["abstract", "quotes"] },
          { id: "hologram", label: "Hologram", lede: "y", sections: ["abstract"] },
          { id: "record", label: "Record", lede: "z", sections: ["transcript"] },
        ],
      } as never,
    }).tiers;
    expect(tiers.map((t) => t.id)).toEqual(["overview"]);
    expect(tiers[0].sections).toEqual(["abstract"]);
  });

  it("falls back to the built-in five rather than losing the hierarchy", () => {
    expect(shapeOf({ _mode: { tiers: [] } }).tiers.map((t) => t.id)).toEqual(
      shapeOf({}).tiers.map((t) => t.id),
    );
  });
});

describe("the tier bands on the page", () => {
  it("draws one band per rendered tier, numbered, labelled and with its lede", () => {
    page(FULL, {
      sections: ["abstract", "insights", "acts", "next", "signals"],
      transcript: "omit",
    });
    expect(bands().map((b) => b.id)).toEqual([
      "overview",
      "concepts",
      "discussion",
      "actions",
      "record",
    ]);
    expect(bands().map((b) => b.n)).toEqual(["01", "02", "03", "04", "05"]);
    expect(bands()[0].label).toBe("Overview");
    expect(bands()[4].label).toBe("The record");
    expect(bands().every((b) => (b.lede ?? "").length > 0)).toBe(true);
  });

  it("draws no band for a tier whose sections the analysis had nothing for", () => {
    // acts is the only discussion section here and the fixture has one, so drop it by
    // naming a tier list the content cannot fill: no quotes, so no record band.
    page({ ...CONTENT, quotes: [] }, { sections: ["abstract", "quotes"], transcript: "omit" });
    expect(bands().map((b) => b.id)).toEqual(["overview"]);
  });

  it("numbers the bands by what is drawn, not by what the mode listed", () => {
    page(FULL, { sections: ["insights", "signals"], transcript: "omit" });
    expect(bands().map((b) => [b.id, b.n])).toEqual([
      ["concepts", "01"],
      ["record", "02"],
    ]);
  });
});

describe("the snapshot at the top of the overview", () => {
  it("puts the verdict's position, the stat tiles and the top two insights in one block", () => {
    page(
      {
        ...FULL,
        verdict: {
          position: "The call turned on delivery, not on the requisition.",
          for: ["a"],
          against: ["b"],
          decides_it: "c",
        },
      },
      { sections: ["abstract", "insights"], transcript: "omit" },
    );
    const snap = document.querySelector(".snapshot")!;
    expect(snap).not.toBeNull();
    expect(snap.querySelector(".snap-position")!.textContent).toBe(
      "The call turned on delivery, not on the requisition.",
    );
    const tiles = [...snap.querySelectorAll(".snap-tile")].map(
      (t) => t.querySelector("dt")!.textContent,
    );
    expect(tiles.length).toBeGreaterThanOrEqual(3);
    expect(tiles.length).toBeLessThanOrEqual(5);
    expect(tiles).toContain("Speakers");
    expect(tiles).toContain("Next steps");
    // the fixture's meta gives the plate its turns and words, so the snapshot, which sits
    // a screen below that header, does not spend a tile repeating either
    expect(tiles).not.toContain("Turns");
    expect(tiles).not.toContain("Words");
    const claims = [...snap.querySelectorAll(".snap-insights li")].map((li) => li.textContent);
    expect(claims).toEqual([INSIGHTS[0].claim, INSIGHTS[1].claim]);
  });

  it("leads the insight lines with their titles, in the order the analysis ranked them", () => {
    const titled = INSIGHTS.map((i, n) => ({ ...i, title: `Title ${n}` }));
    page({ ...FULL, insights: titled }, { sections: ["abstract"], transcript: "omit" });
    const lines = [...document.querySelectorAll(".snap-insights li")].map((li) => li.textContent);
    expect(lines).toEqual(["Title 0", "Title 1"]);
  });

  it("carries the plain call stats when the plate has not claimed them", () => {
    // no meta turns or words on the plate, so the snapshot is free to carry them
    page(
      { ...CONTENT, meta: { ...CONTENT.meta, turns: undefined, words: undefined } },
      { sections: ["abstract"], transcript: "omit" },
    );
    const tiles = [...document.querySelectorAll(".snap-tile dt")].map((t) => t.textContent);
    expect(tiles).toContain("Turns");
    expect(tiles.length).toBeGreaterThanOrEqual(3);
  });

  it("drops a tile whose number already appears on the plate under a different label", () => {
    // the plate carries the same head count as "Attendees"; the snapshot must not
    // restate it as "Speakers" just because the label text doesn't match
    const content: Content = {
      ...CONTENT,
      meta: {
        ...CONTENT.meta,
        turns: undefined,
        words: undefined,
        extra: [["Attendees", 2]],
      },
      next_steps: [{ ts: "00:00:40", s: 40, commitment: "send notes" }],
      insights: [INSIGHTS[0]],
    };
    page(content, { sections: ["abstract"], transcript: "omit" });
    const tiles = [...document.querySelectorAll(".snap-tile dt")].map((t) => t.textContent);
    expect(tiles).not.toContain("Speakers");
    expect(tiles).toContain("Next steps");
    expect(tiles).toContain("Claims");
  });

  it("renders no tile row at all when fewer than three tiles would be genuinely new, but keeps the verdict", () => {
    // duration, turns, words and the speaker count are all already on the plate; a
    // fallback that restates them would be worse than showing no tiles
    const content: Content = {
      ...CONTENT,
      meta: {
        ...CONTENT.meta,
        duration_label: "2 min",
        turns: 3,
        words: 40,
        extra: [["Attendees", 2]],
      },
      verdict: { position: "Verdict stands alone.", for: ["a"], against: ["b"], decides_it: "c" },
    };
    page(content, { sections: ["abstract"], transcript: "omit" });
    const snap = document.querySelector(".snapshot")!;
    expect(snap.querySelector(".snap-position")!.textContent).toBe("Verdict stands alone.");
    expect(snap.querySelectorAll(".snap-tile").length).toBe(0);
  });

  it("in a fully-populated build, still shows whatever tiles are genuinely new", () => {
    const content: Content = {
      ...FULL,
      meta: {
        ...FULL.meta,
        duration_label: "2 min",
        turns: 5,
        words: 40,
        extra: [["Attendees", 2]],
      },
      threads: [{ name: "x", what: "y", why_it_matters: "z" }],
    };
    page(content, { sections: ["abstract", "insights"], transcript: "omit" });
    const tiles = [...document.querySelectorAll(".snap-tile dt")].map((t) => t.textContent);
    expect(tiles).toEqual(["Next steps", "Claims", "Threads"]);
  });

  it("stands the abstract's first sentence in when the analysis reached no verdict", () => {
    page(
      { ...CONTENT, abstract: "Two people, three turns. Then a second sentence nobody needs." },
      { sections: ["abstract"], transcript: "omit" },
    );
    expect(document.querySelector(".snap-position")!.textContent).toBe("Two people, three turns.");
  });

  it("sits above the strip chart, at the top of the overview tier", () => {
    page(FULL, { sections: ["abstract", "signals"], transcript: "omit" });
    const band = document.querySelector('.tier-band[data-tier="overview"]')!;
    const snap = document.querySelector(".snapshot")!;
    const abstract = document.getElementById("sec-abstract")!;
    expect(band.compareDocumentPosition(snap) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(snap.compareDocumentPosition(abstract) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("is not drawn on a page with no overview tier", () => {
    page(FULL, { sections: ["insights", "signals"], transcript: "omit" });
    expect(document.querySelector(".snapshot")).toBeNull();
  });
});

describe("the tier navigation", () => {
  it("lists every rendered tier, in order, linking to its band", () => {
    page(FULL, {
      sections: ["abstract", "insights", "acts", "next", "signals"],
      transcript: "omit",
    });
    const nav = screen.getByRole("navigation", { name: "Tiers" });
    const links = [...nav.querySelectorAll("a")];
    expect(links.map((a) => a.textContent)).toEqual([
      "Overview",
      "Main concepts",
      "What was discussed",
      "Action steps",
      "The record",
    ]);
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "#tier-overview",
      "#tier-concepts",
      "#tier-discussion",
      "#tier-actions",
      "#tier-record",
    ]);
    expect(links.every((a) => document.getElementById(a.getAttribute("href")!.slice(1)))).toBe(
      true,
    );
  });

  // jsdom lays nothing out, so the band positions the observer reads are stubbed: the
  // reader is inside the overview, with the record still below the fold.
  afterEach(() => vi.restoreAllMocks());

  it("marks the tier the reader is in, and only that one", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
      this: Element,
    ) {
      const tier = (this as HTMLElement).dataset?.tier;
      return { top: tier === "record" ? 600 : 0 } as DOMRect;
    });
    page(FULL, { sections: ["abstract", "signals"], transcript: "omit" });
    const nav = screen.getByRole("navigation", { name: "Tiers" });
    expect([...nav.querySelectorAll("a.on")].map((a) => a.textContent)).toEqual(["Overview"]);
    expect(nav.querySelector('a[aria-current="true"]')!.textContent).toBe("Overview");
  });

  it("marks the record once the reader has scrolled into it", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      () => ({ top: -40 }) as DOMRect,
    );
    page(FULL, { sections: ["abstract", "signals"], transcript: "omit" });
    const nav = screen.getByRole("navigation", { name: "Tiers" });
    expect([...nav.querySelectorAll("a.on")].map((a) => a.textContent)).toEqual(["The record"]);
  });

  it("has nothing to navigate on a page with a single tier", () => {
    page(CONTENT, { sections: ["abstract"], transcript: "omit" });
    expect(screen.queryByRole("navigation", { name: "Tiers" })).toBeNull();
  });
});
