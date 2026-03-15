"use client";

import { useCallback, useMemo, useState } from "react";
import type { GridCell, MatchSnapshot, PlayerInput } from "../../../shared/types";

function cell(x: number, y: number, type: GridCell["type"]): GridCell {
  return { type, x, y };
}

function buildDemoGrid(): GridCell[][] {
  const w = 13;
  const h = 11;
  const grid: GridCell[][] = [];
  for (let y = 0; y < h; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < w; x++) {
      const atBorder = x === 0 || x === w - 1 || y === 0 || y === h - 1;
      const inSpawn = (x <= 2 && y <= 2) || (x >= w - 3 && y <= 2) || (x <= 2 && y >= h - 3) || (x >= w - 3 && y >= h - 3);
      const soft = (x === 3 || x === 5 || x === 7 || x === 9) && (y === 2 || y === 4 || y === 6 || y === 8);
      let type: GridCell["type"] = "floor";
      if (atBorder && !inSpawn) type = "hard_block";
      else if (soft) type = "soft_block";
      row.push(cell(x, y, type));
    }
    grid.push(row);
  }
  return grid;
}

const INITIAL_SNAPSHOT: MatchSnapshot = {
  status: "active",
  tick: 0,
  grid: buildDemoGrid(),
  players: [
    { id: "player-0", x: 1, y: 1, alive: true, bombs: 1, range: 1 },
  ],
  bombs: [],
  explosions: [],
  powerups: [],
};

function isWalkable(grid: GridCell[][], x: number, y: number): boolean {
  if (y < 0 || y >= grid.length || x < 0 || x >= (grid[0]?.length ?? 0)) return false;
  const cell = grid[y]?.[x];
  return cell?.type === "floor" || cell?.type === "powerup";
}

function nextPos(x: number, y: number, input: PlayerInput): { x: number; y: number } {
  switch (input) {
    case "up": return { x, y: y - 1 };
    case "down": return { x, y: y + 1 };
    case "left": return { x: x - 1, y };
    case "right": return { x: x + 1, y };
    default: return { x, y };
  }
}

export function useLocalMatch(): { snapshot: MatchSnapshot; onInput: (input: PlayerInput) => void } {
  const [snapshot, setSnapshot] = useState<MatchSnapshot>(INITIAL_SNAPSHOT);

  const onInput = useCallback((input: PlayerInput) => {
    if (input === "place_bomb") return;
    setSnapshot((prev) => {
      const player = prev.players[0];
      if (!player?.alive) return prev;
      const { x, y } = nextPos(player.x, player.y, input);
      if (!isWalkable(prev.grid, x, y)) return prev;
      return {
        ...prev,
        tick: prev.tick + 1,
        players: prev.players.map((p) => (p.id === player.id ? { ...p, x, y } : p)),
      };
    });
  }, []);

  return useMemo(() => ({ snapshot, onInput }), [snapshot, onInput]);
}
