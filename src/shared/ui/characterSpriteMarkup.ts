/** Root class on the element that carries `data-character-id` (lobby + Phaser DOM). */
export const CHARACTER_SPRITE_ROOT_CLASS = "detonadores-char";

/** Shared inner DOM; palette and props come from `[data-character-id]` in globals.css. */
export function getCharacterSpriteInnerHtml(): string {
  return [
    '<div class="detonadores-char__inner">',
    '<div class="detonadores-char__top" aria-hidden="true"></div>',
    '<div class="detonadores-char__accent" aria-hidden="true"></div>',
    '<div class="detonadores-char__head"></div>',
    '<div class="detonadores-char__eyes" aria-hidden="true"></div>',
    '<div class="detonadores-char__torso"></div>',
    '<div class="detonadores-char__legs"></div>',
    "</div>",
  ].join("");
}

export function buildCharacterSpriteRootClassnames(options: {
  size: "sm" | "md" | "match";
  animate?: boolean;
  dead?: boolean;
  interactive?: boolean;
}): string {
  const { size, animate = true, dead = false, interactive = false } = options;
  const parts = [
    CHARACTER_SPRITE_ROOT_CLASS,
    size === "sm" ? "detonadores-char--sm" : size === "md" ? "detonadores-char--md" : "detonadores-char--match",
  ];
  if (animate) parts.push("detonadores-char--anim");
  if (dead) parts.push("detonadores-char--dead");
  if (interactive) parts.push("detonadores-char--interactive");
  return parts.join(" ");
}

