/**
 * The object kit, reachable from React. This is a copy of `skills/diagrams/icons.svg`,
 * the same sprite a hand-authored fragment inlines, so a figure drawn in React and a
 * figure drawn by hand use the same drawings. Vite will not read through a symlink out
 * of its root, hence the copy; `glyphs.test.tsx` fails if the two ever drift apart. It
 * is inlined at build time, so the page still makes no external request.
 */
import sprite from "./icons.svg?raw";

/** Every object in the kit, in sprite order. */
export const ICON_NAMES: string[] = [...sprite.matchAll(/<symbol\s+id="icon-([\w-]+)"/g)].map(
  (m) => m[1],
);

export type IconName = string;

/**
 * The sprite, once per document. A page that draws glyphs in React renders this at the
 * top of its tree; a page whose fragment already inlined the sprite does not need it.
 */
export function IconSprite() {
  return <span hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: sprite }} />;
}

/**
 * One object from the kit at a given size. It paints in `currentColor`, so it takes the
 * pen of whatever it is dropped into, exactly as the hand-authored `<use>` does.
 */
export function Icon({ name, size = 40, x = 0, y = 0 }: {
  name: IconName;
  size?: number;
  x?: number;
  y?: number;
}) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 48 48" overflow="visible">
      <use href={`#icon-${name}`} />
    </svg>
  );
}
