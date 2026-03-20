import type { CharacterId } from "../constants/characters";
import { buildCharacterSpriteRootClassnames, getCharacterSpriteInnerHtml } from "./characterSpriteMarkup";

export type CharacterSpriteSize = "sm" | "md" | "match";

type Props = {
  id: CharacterId;
  size: CharacterSpriteSize;
  dead?: boolean;
  animate?: boolean;
  /** Lobby buttons need clicks to hit the button, not the sprite overlay. */
  interactive?: boolean;
  className?: string;
};

export function CharacterSprite({
  id,
  size,
  dead = false,
  animate = true,
  interactive = false,
  className = "",
}: Props) {
  const rootClass = `${buildCharacterSpriteRootClassnames({ size, animate, dead, interactive })}${className ? ` ${className}` : ""}`;
  return (
    <span
      className={rootClass}
      data-character-id={id}
      dangerouslySetInnerHTML={{ __html: getCharacterSpriteInnerHtml() }}
    />
  );
}
