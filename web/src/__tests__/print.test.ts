import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The page hides everything it is about to reveal on scroll. Paper does not scroll, and
 * neither does a full-page capture: without this rule every section below the first
 * screen prints blank. The vanilla template has always carried it; the React build did
 * not, and printed an empty document.
 */
describe("print", () => {
  const css = readFileSync(resolve(__dirname, "../app.css"), "utf8");

  it("shows every revealable element on paper", () => {
    const block = css.match(/@media print\s*\{[\s\S]*?\n\}/);
    expect(block, "app.css has no @media print block").not.toBeNull();
    expect(block![0]).toMatch(/\.rv\s*\{[^}]*opacity:\s*1/);
  });

  it("hides the scroll-only furniture on paper", () => {
    const block = css.match(/@media print\s*\{[\s\S]*?\n\}/)![0];
    expect(block).toMatch(/\.tier-nav\b/);
  });
});
