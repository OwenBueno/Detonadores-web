"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MatchSnapshot, PlayerInput } from "../../../shared/types";
import { createArena, MatchEngine, TICK_INTERVAL_MS } from "../offline";

const LOCAL_PLAYER_ID = "player-0";

export function useOfflineEngine(): {
  snapshot: MatchSnapshot | null;
  onInput: (input: PlayerInput) => void;
  restart: () => void;
} {
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const engineRef = useRef<MatchEngine | null>(null);
  const tickLoopIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTickLoop = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (tickLoopIdRef.current) clearInterval(tickLoopIdRef.current);
    tickLoopIdRef.current = setInterval(() => {
      engine.tick();
      const next = engine.getSnapshot();
      setSnapshot(next);
      if (next.status === "ended" && tickLoopIdRef.current) {
        clearInterval(tickLoopIdRef.current);
        tickLoopIdRef.current = null;
      }
    }, TICK_INTERVAL_MS);
  }, []);

  const restart = useCallback(() => {
    if (tickLoopIdRef.current) {
      clearInterval(tickLoopIdRef.current);
      tickLoopIdRef.current = null;
    }
    const engine = new MatchEngine();
    engineRef.current = engine;
    const { grid, initialPlayers } = createArena(2);
    const withCosmetics = initialPlayers.map((pl, i) => ({
      ...pl,
      characterId: i === 0 ? "char_1" : "char_2",
    }));
    engine.startMatch(grid, withCosmetics);
    setSnapshot(engine.getSnapshot());
    startTickLoop();
  }, [startTickLoop]);

  useEffect(() => {
    const engine = new MatchEngine();
    engineRef.current = engine;
    const { grid, initialPlayers } = createArena(2);
    const withCosmetics = initialPlayers.map((pl, i) => ({
      ...pl,
      characterId: i === 0 ? "char_1" : "char_2",
    }));
    engine.startMatch(grid, withCosmetics);
    setSnapshot(engine.getSnapshot());
    startTickLoop();
    return () => {
      if (tickLoopIdRef.current) {
        clearInterval(tickLoopIdRef.current);
        tickLoopIdRef.current = null;
      }
      engineRef.current = null;
    };
  }, [startTickLoop]);

  const onInput = useCallback((input: PlayerInput) => {
    engineRef.current?.applyInput(LOCAL_PLAYER_ID, input);
  }, []);

  return { snapshot, onInput, restart };
}
