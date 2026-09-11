import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../App";
import { deck } from "../lib/deck";
import type { Content } from "../types";
import { CONTENT, METRICS, TURNS } from "./fixture";

/**
 * The mode's section list is a shape, not a filter on facts, so these check ordering and
 * presence only. The strip chart is left out of every mode here: it is the one section
 * that pulls in three.js, and none of this is about the chart.
 */
const FULL: Content = {
  ...CONTENT,
  quotes: [{ ts: "00:00:40", s: 40, speaker: "B", text: "the one i meant" }],
  numbers: [{ ts: "00:00:00", s: 0, value: "3", means: "turns" }],
  signals: [{ ts: "00:00:00", s: 0, signal: "agreement" }],
};

function page(mode?: Content["_mode"]) {
  render(<App deck={deck({ ...FULL, _mode: mode }, TURNS, METRICS, "")} />);
  return [...document.querySelectorAll("main > section")].map((s) => s.id);
}

describe("the mode decides the page's shape", () => {
  it("renders the sections it names, in the order it names them", () => {
    expect(page({ sections: ["quotes", "abstract", "acts"], transcript: "omit" })).toEqual([
      "sec-quotes",
      "sec-abstract",
      "sec-acts",
    ]);
  });

  it("drops a section the mode left out, heading and all", () => {
    const ids = page({ sections: ["abstract"], transcript: "omit" });
    expect(ids).toEqual(["sec-abstract"]);
    expect(screen.queryByText("Quotes")).not.toBeInTheDocument();
  });

  it("drops a section the analysis had nothing for, whatever the mode says", () => {
    render(
      <App
        deck={deck(
          { ...CONTENT, _mode: { sections: ["abstract", "quotes"], transcript: "omit" } },
          TURNS,
          METRICS,
          "",
        )}
      />,
    );
    expect([...document.querySelectorAll("main > section")].map((s) => s.id)).toEqual([
      "sec-abstract",
    ]);
  });

  it("omits the transcript when the mode says omit, and keeps it otherwise", () => {
    expect(page({ sections: ["abstract"], transcript: "omit" })).not.toContain("sec-transcript");
    document.body.innerHTML = "";
    expect(page({ sections: ["abstract"], transcript: "collapsed" })).toContain("sec-transcript");
  });

  it("opens the transcript straight onto the page when the mode says open", async () => {
    page({ sections: ["abstract"], transcript: "open" });
    // the sections compose top to bottom, so the reader arrives a beat after the shell
    expect(await screen.findByRole("navigation", { name: "Chapters" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /read the transcript/i })).not.toBeInTheDocument();
  });

  it("sits signals and numbers side by side when the mode asks for both in a row", async () => {
    page({ sections: ["signals", "numbers"], transcript: "omit" });
    expect(screen.getByText("Signals & numbers")).toBeInTheDocument();
    await waitFor(() => expect(document.querySelector(".twoup")).not.toBeNull());
  });
});

const INSIGHT = {
  claim: "The screen would have rejected the strongest candidate signal.",
  implication: "Hire on the delivery axis the requisition was not written for.",
  confidence: "high" as const,
  supports: [{ ts: "00:00:40", s: 40, observation: "he said so on the call" }],
};

describe("insights and the appendix", () => {
  function renderWith(mode: Content["_mode"], extra: Partial<Content> = {}) {
    render(<App deck={deck({ ...FULL, ...extra, _mode: mode }, TURNS, METRICS, "")} />);
    return [...document.querySelectorAll("main > section")].map((s) => s.id);
  }

  it("gives insights their own section, where the mode places them", () => {
    const ids = renderWith(
      { sections: ["abstract", "insights", "signals"], transcript: "omit" },
      { insights: [INSIGHT] },
    );
    expect(ids).toEqual(["sec-abstract", "sec-insights", "sec-signals"]);
  });

  it("renders the claim, a timestamped support and the so-what", async () => {
    renderWith({ sections: ["insights"], transcript: "omit" }, { insights: [INSIGHT] });
    expect(await screen.findByText(INSIGHT.claim)).toBeInTheDocument();
    expect(screen.getByText(INSIGHT.supports[0].observation)).toBeInTheDocument();
    expect(screen.getByText(INSIGHT.implication)).toBeInTheDocument();
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "00:00:40" })).toBeInTheDocument();
  });

  it("drops the appendix section when the analysis had no insights", () => {
    const ids = renderWith({ sections: ["abstract", "insights"], transcript: "omit" });
    expect(ids).toEqual(["sec-abstract"]);
  });

  it("marks the appendix boundary with a divider and folds what follows it", async () => {
    renderWith({
      sections: ["abstract", "signals"],
      appendix: ["signals"],
      collapsed: ["signals"],
      transcript: "omit",
    });
    expect(await screen.findByRole("button", { name: /show signals/i })).toBeInTheDocument();
    const divider = document.querySelector(".appendix-divider")!;
    expect(divider).not.toBeNull();
    const signals = document.getElementById("sec-signals")!;
    expect(divider.compareDocumentPosition(signals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("has no divider when the mode names no appendix", () => {
    renderWith({ sections: ["abstract", "signals"], transcript: "omit" }, { insights: [INSIGHT] });
    expect(document.querySelector(".appendix-divider")).toBeNull();
  });
});
