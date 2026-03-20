export const CHARACTER_IDS = ["char_1", "char_2", "char_3", "char_4"] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export const CHARACTER_LABELS: Record<CharacterId, string> = {
  char_1: "Detonador 1",
  char_2: "Detonador 2",
  char_3: "Detonador 3",
  char_4: "Detonador 4",
};
