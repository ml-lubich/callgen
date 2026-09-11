import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Insights, iconFor } from "../sections/Insights";
import type { Insight } from "../types";
import { TURNS } from "./fixture";

const BASE: Insight = {
  title: "The screen is the wrong filter",
  claim: "The screen would have rejected the strongest candidate signal.",
  implication: "Hire on the delivery axis the requisition was not written for.",
  confidence: "high",
  basis: "Said on the call at 00:00:40 and never contested.",
  supports: [
    { ts: "00:00:40", s: 40, observation: "he said so on the call" },
    { ts: "00:01:20", s: 80, observation: "nobody argued with it" },
  ],
};

const SECOND: Insight = {
  ...BASE,
  title: "Nightly imports never arrive clean",
  claim: "One live account's export can never be clean.",
  confidence: "medium",
  supports: [{ ts: "00:00:00", s: 0, observation: "three systems feed the export" }],
};

function page(insights: Insight[]) {
  render(<Insights insights={insights} turns={TURNS} />);
  return [...document.querySelectorAll(".insight-card")] as HTMLElement[];
}

describe("insights read as concept cards", () => {
  it("gives every insight a card headed by its title, with the claim under it", () => {
    const cards = page([BASE, SECOND]);
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector(".insight-claim")).toHaveTextContent(BASE.title!);
    expect(cards[0].querySelector(".insight-idea")).toHaveTextContent(BASE.claim);
    expect(cards[1].querySelector(".insight-claim")).toHaveTextContent(SECOND.title!);
    // the drawing is the first thing in the card, and it is decoration over the heading
    expect(cards[0].querySelector(".insight-icon use")).not.toBeNull();
  });

  it("heads the card with the claim when the analysis wrote no title", () => {
    const { title: _title, ...untitled } = BASE;
    const cards = page([untitled]);
    expect(cards[0].querySelector(".insight-claim")).toHaveTextContent(BASE.claim);
    expect(cards[0].querySelector(".insight-idea")).toBeNull();
  });

  it("shows the confidence on the closed card", () => {
    page([BASE]);
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
  });

  it("keeps the supports, the so-what and the basis behind the disclosure", async () => {
    page([BASE]);
    expect(screen.queryByText(BASE.supports[0].observation)).not.toBeInTheDocument();
    expect(screen.queryByText(BASE.implication)).not.toBeInTheDocument();
    expect(screen.queryByText(BASE.basis!)).not.toBeInTheDocument();

    const open = screen.getByRole("button", { name: /why this holds/i });
    expect(open).toHaveAttribute("aria-expanded", "false");
    // the count is on the button, so the card says how much it is hiding
    expect(open).toHaveTextContent("2 supports");

    await userEvent.click(open);
    expect(open).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(BASE.supports[0].observation)).toBeInTheDocument();
    expect(screen.getByText(BASE.implication)).toBeInTheDocument();
    expect(screen.getByText(BASE.basis!)).toBeInTheDocument();
  });

  it("counts a lone support in the singular", () => {
    page([SECOND]);
    expect(screen.getByRole("button", { name: /why this holds/i })).toHaveTextContent("1 support");
  });

  it("deep-links a timestamp inside an opened card to its turn", async () => {
    page([BASE]);
    await userEvent.click(screen.getByRole("button", { name: /why this holds/i }));
    const link = screen.getByRole("link", { name: "00:00:40" });
    // TURNS[1] is the turn at 40s, and that is the anchor the transcript listens on
    expect(link).toHaveAttribute("href", "#t-1");
    expect(link).toHaveClass("ts");
  });

  it("lets the first-ranked card span the grid, and no other", () => {
    const cards = page([BASE, SECOND]);
    expect(cards[0]).toHaveClass("insight-lead");
    expect(cards[1]).not.toHaveClass("insight-lead");
  });

  it("does not re-sort what the analysis ranked", () => {
    const cards = page([SECOND, BASE]);
    expect(cards[0].querySelector(".insight-claim")).toHaveTextContent(SECOND.title!);
    expect(cards[1].querySelector(".insight-claim")).toHaveTextContent(BASE.title!);
  });
});

describe("the icon comes from the insight's own words", () => {
  /** The rule under test: the earliest word in the claim that names an object wins. */
  const pick = (claim: string, title?: string) =>
    iconFor({ ...BASE, title, claim, supports: [] });

  it("draws the object the claim names first", () => {
    expect(pick("The export file was rejected every night.")).toBe("document");
    expect(pick("Support fixes the bad row by hand.")).toBe("team");
    expect(pick("One bad row in a good file is the common case.")).toBe("database");
  });

  it("reads the title ahead of the claim, since the title is read first", () => {
    expect(pick("Support carries the cost.", "A failure every night")).toBe("alert");
  });

  it("falls back to one neutral object when the insight names none", () => {
    expect(pick("Everyone nodded and moved on.")).toBe("document-stack");
  });

  it("is stable: the same words always pick the same object", () => {
    expect(pick("The cost of rejecting a file is paid today.")).toBe(
      pick("The cost of rejecting a file is paid today."),
    );
  });
});
