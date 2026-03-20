export const CHARACTER_IDS = ["char_1", "char_2", "char_3", "char_4"] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export function isCharacterId(value: string): value is CharacterId {
  return (CHARACTER_IDS as readonly string[]).includes(value);
}

/** Display names — vecindad archetypes; tone per docs/initial.md (playful colonia humor, no edge topics). */
export const CHARACTER_LABELS: Record<CharacterId, string> = {
  char_1: "La Doña Lucha",
  char_2: "El Compa Nacho",
  char_3: "La Chivis",
  char_4: "Don Beto",
};

export const CHARACTER_TAGLINES: Record<CharacterId, string> = {
  char_1: "Aquí manda quien sabe.",
  char_2: "Nomás era una partidita.",
  char_3: "Rápido y con estilo.",
  char_4: "Con calma y buena mano.",
};

/** Phaser fill/stroke (0xRRGGBB) + CSS hex for lobby swatches — cosmetic only, not gameplay. */
export const CHARACTER_RENDER: Record<
  CharacterId,
  { fill: number; stroke: number; cssHex: string }
> = {
  char_1: { fill: 0xed8936, stroke: 0xc05621, cssHex: "#ed8936" },
  char_2: { fill: 0x4299e1, stroke: 0x2b6cb0, cssHex: "#4299e1" },
  char_3: { fill: 0xd53f8c, stroke: 0xb83280, cssHex: "#d53f8c" },
  char_4: { fill: 0xd69e2e, stroke: 0xb7791f, cssHex: "#d69e2e" },
};

export function resolveCharacterIdForPlayer(
  characterId: string | undefined,
  playerIndex: number
): CharacterId {
  if (characterId && isCharacterId(characterId)) return characterId;
  return CHARACTER_IDS[playerIndex % CHARACTER_IDS.length]!;
}

export function renderColorsForPlayer(
  characterId: string | undefined,
  playerIndex: number
): { fill: number; stroke: number } {
  const id = resolveCharacterIdForPlayer(characterId, playerIndex);
  const r = CHARACTER_RENDER[id];
  return { fill: r.fill, stroke: r.stroke };
}
