import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  BigNumber,
  Cascade,
  Compare,
  ConceptCard,
  DocGlyph,
  FieldRow,
  GateChain,
  ICON_NAMES,
  IconSprite,
  MagnitudeBar,
  Matrix2x2,
  PersonGlyph,
  Ring,
  Route,
  ScaleBar,
  Stack,
  Timeline,
  Venn2,
  fit,
  wrap,
  type Pen,
} from "../glyphs";

const cases: [string, (pen: Pen) => React.ReactElement][] = [
  ["ScaleBar", (pen) => <ScaleBar value={0.6} label="score" pen={pen} />],
  ["FieldRow", (pen) => <FieldRow label="issuer" state="cited" pen={pen} />],
  ["DocGlyph", (pen) => <DocGlyph badge="OCR" label="statement" pen={pen} />],
  ["PersonGlyph", (pen) => <PersonGlyph label="analyst" pen={pen} />],
  ["GateChain", (pen) => <GateChain n={3} labels={["a", "b", "c"]} pen={pen} />],
  ["Cascade", (pen) => <Cascade steps={["one", "two"]} pen={pen} />],
  ["MagnitudeBar", (pen) => <MagnitudeBar label="rows" value={25} max={119000} pen={pen} />],
  ["BigNumber", (pen) => <BigNumber value={119000} unit="rows" caption="of them" pen={pen} />],
  ["Compare", (pen) => <Compare left="claim" right="evidence" out="verdict" pen={pen} />],
  ["Route", (pen) => <Route from="source" to={["one", "two"]} pen={pen} />],
  ["ConceptCard", (pen) => <ConceptCard icon="database" name="Stock ledger" body="one row per bin" pen={pen} />],
  [
    "Timeline",
    (pen) => <Timeline events={[{ at: 0, label: "open" }, { at: 9, label: "close" }]} pen={pen} />,
  ],
  [
    "Venn2",
    (pen) => <Venn2 leftName="asked" rightName="bought" left="41" right="12" both="7" pen={pen} />,
  ],
  [
    "Matrix2x2",
    (pen) => (
      <Matrix2x2
        xAxis="effort"
        yAxis="value"
        quadrants={["quick wins", "big bets", "skip", "chores"]}
        pen={pen}
      />
    ),
  ],
  ["Stack", (pen) => <Stack layers={["intake", "review"]} pen={pen} />],
  ["Ring", (pen) => <Ring value={0.8} caption="closes itself" pen={pen} />],
];

describe("glyph library", () => {
  it.each(cases)("%s carries the pen it was given", (_name, make) => {
    for (const pen of ["a", "b", "neutral"] as Pen[]) {
      const { container, unmount } = render(make(pen));
      const root = container.firstElementChild!;
      expect(root).toHaveClass("gl");
      expect(root).toHaveClass(`pen-${pen}`);
      unmount();
    }
  });

  it.each(cases)("%s names and describes itself", (_name, make) => {
    const { container } = render(make("a"));
    const svg = container.querySelector("svg");
    if (!svg) return; // BigNumber is set in HTML, not drawn
    expect(svg.querySelector(":scope > title")?.textContent?.trim()).toBeTruthy();
    expect(svg.querySelector(":scope > desc")?.textContent?.trim()).toBeTruthy();
  });

  it("defaults to the neutral pen", () => {
    const { container } = render(<ScaleBar value={0.2} />);
    expect(container.firstElementChild).toHaveClass("pen-neutral");
  });

  it("marks an unbounded scale that ran off the end", () => {
    const { container } = render(<ScaleBar value={4} max={1} kind="unbounded" />);
    expect(container.textContent).toContain("≫");
  });

  it("draws a dashed track for a field that was never filled", () => {
    const { container } = render(<FieldRow label="issuer" state="empty" />);
    expect(container.querySelector("[stroke-dasharray]")).not.toBeNull();
  });
});

/** What a label actually paints, without the <title> that carries its full value. */
function shown(el: Element): string {
  return [...el.childNodes]
    .filter((n) => n.nodeName.toLowerCase() !== "title")
    .map((n) => n.textContent)
    .join("");
}

describe("labels that do not fit", () => {
  it("cuts a label to the room it has and keeps the ellipsis", () => {
    expect(fit("short", 400, 13)).toBe("short");
    const cut = fit("a label far longer than the plate it sits on", 60, 13);
    expect(cut.length).toBeLessThan(20);
    expect(cut.endsWith("…")).toBe(true);
  });

  it("breaks a label over the lines it was given, never more", () => {
    expect(wrap("one two three four five six", 60, 13, 2)).toHaveLength(2);
    expect(wrap("one", 200, 13, 2)).toEqual(["one"]);
  });

  it("keeps the full value on a cut label, for a reader who cannot see it", () => {
    const long = "an issuer name that will not fit in the gutter";
    const { container } = render(<FieldRow label={long} state="filled" />);
    const text = container.querySelector("text")!;
    expect(shown(text)).not.toBe(long);
    expect(text.querySelector("title")?.textContent).toBe(long);
  });

  it("does not clip Compare at a narrow width", () => {
    const { container } = render(
      <Compare left="a very long left hand claim" right="a very long right hand claim" width={200} />,
    );
    const [left, right] = [...container.querySelectorAll("text")];
    expect(shown(left).length).toBeLessThan(16);
    expect(shown(right).length).toBeLessThan(16);
    expect(left.querySelector("title")!.textContent).toBe("a very long left hand claim");
  });

  it("keeps Route's fan point inside a narrow plate", () => {
    const { container } = render(<Route from="a long source name" to={["one", "two"]} width={200} />);
    const node = container.querySelector("circle")!;
    expect(Number(node.getAttribute("cx"))).toBeLessThan(100);
    expect([...container.querySelectorAll("text")].at(-1)!.textContent).toBe("two");
  });
});

describe("ConceptCard", () => {
  it("heads the tile with the object it is about", () => {
    const { container } = render(
      <ConceptCard icon="database" name="Stock ledger" body="one row per bin" ts="00:04:12" />,
    );
    expect(container.querySelectorAll('use[href="#icon-database"]')).toHaveLength(1);
    expect(container.querySelectorAll("rect")).toHaveLength(1);
    expect(container.textContent).toContain("Stock ledger");
    expect(container.textContent).toContain("one row per bin");
    expect(container.textContent).toContain("00:04:12");
  });

  it("leaves out the body and the timestamp when it has none", () => {
    const { container } = render(<ConceptCard icon="clock" name="Dwell" />);
    expect(container.querySelectorAll("text")).toHaveLength(1);
  });
});

describe("Timeline", () => {
  const events = [
    { at: 0, label: "kickoff" },
    { at: 12, label: "the number" },
    { at: 31, label: "objection" },
    { at: 44, label: "decision" },
  ];

  it("puts one mark on the axis per event and labels every one", () => {
    const { container } = render(<Timeline events={events} />);
    expect(container.querySelectorAll("circle")).toHaveLength(events.length);
    for (const e of events) expect(container.textContent).toContain(e.label);
    expect(container.textContent).toContain("minutes");
  });

  it("staggers the labels above and below so twelve do not collide", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ at: i * 5, label: `event ${i}` }));
    const { container } = render(<Timeline events={many} />);
    const ys = [...container.querySelectorAll("circle")].map((c) => c.getAttribute("cy"));
    expect(new Set(ys).size).toBe(1); // every mark is on the one axis
    const labels = [...container.querySelectorAll("text")].filter((t) =>
      t.textContent!.startsWith("event"),
    );
    expect(new Set(labels.map((t) => t.getAttribute("y"))).size).toBe(2);
  });

  it("rules the axis in minutes", () => {
    const { container } = render(<Timeline events={events} minutes={60} />);
    const ticks = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(ticks).toContain("0");
    expect(ticks).toContain("60");
  });
});

describe("Venn2", () => {
  it("draws two sets and fills all three regions", () => {
    const { container } = render(
      <Venn2 leftName="asked for it" rightName="bought it" left="41" right="12" both="7" />,
    );
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    const text = container.textContent!;
    for (const part of ["asked for it", "bought it", "41", "12", "7"]) {
      expect(text).toContain(part);
    }
  });
});

describe("Matrix2x2", () => {
  it("labels both axes and all four quadrants", () => {
    const { container } = render(
      <Matrix2x2
        xAxis="effort"
        yAxis="value"
        quadrants={["quick wins", "big bets", "park it", "chores"]}
      />,
    );
    const text = container.textContent!;
    for (const part of ["effort", "value", "quick wins", "big bets", "park it", "chores"]) {
      expect(text).toContain(part);
    }
  });

  it("places one dot per item", () => {
    const { container } = render(
      <Matrix2x2
        xAxis="effort"
        yAxis="value"
        quadrants={["a", "b", "c", "d"]}
        items={[
          { x: 0.2, y: 0.8, label: "handheld" },
          { x: 0.9, y: 0.3, label: "rewrite" },
        ]}
      />,
    );
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    expect(container.textContent).toContain("handheld");
  });
});

describe("Stack", () => {
  it("draws one layer per entry, in the order given", () => {
    const { container } = render(<Stack layers={["intake", "triage", "fix"]} />);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
    const labels = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(labels).toEqual(["1", "intake", "2", "triage", "3", "fix"]);
    expect(container.querySelectorAll("path")).toHaveLength(0);
  });

  it("draws an arrow between layers when asked for a pipeline", () => {
    const { container } = render(<Stack layers={["intake", "triage", "fix"]} arrows />);
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });
});

describe("Ring", () => {
  it("prints the share in the middle and the caption beneath", () => {
    const { container } = render(<Ring value={0.8} caption="closes without anyone touching it" />);
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    expect(container.textContent).toContain("80%");
    expect(container.textContent).toContain("closes");
  });

  it("draws the arc at the share it was given", () => {
    const { container } = render(<Ring value={0.25} />);
    const arc = container.querySelectorAll("circle")[1];
    const [drawn, whole] = arc.getAttribute("stroke-dasharray")!.split(" ").map(Number);
    expect(drawn / whole).toBeCloseTo(0.25, 2);
  });

  it("takes a display value over the percentage", () => {
    const { container } = render(<Ring value={0.8} display="4 of 5" />);
    expect(container.textContent).toContain("4 of 5");
  });
});

describe("the object kit", () => {
  it("is the same sprite the hand-authored figures inline", () => {
    const skill = readFileSync(resolve(__dirname, "../../../skills/diagrams/icons.svg"), "utf8");
    const copy = readFileSync(resolve(__dirname, "../glyphs/icons.svg"), "utf8");
    expect(copy).toBe(skill);
  });

  it("renders the sprite once, hidden, with every object in it", () => {
    const { container } = render(<IconSprite />);
    expect(ICON_NAMES.length).toBeGreaterThan(20);
    expect(container.querySelectorAll("symbol")).toHaveLength(ICON_NAMES.length);
    expect(container.firstElementChild).toHaveAttribute("hidden");
  });
});
