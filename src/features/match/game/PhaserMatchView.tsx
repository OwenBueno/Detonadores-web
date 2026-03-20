"use client";

import * as Phaser from "phaser";
import { useEffect, useRef } from "react";
import type { MatchSnapshot, PlayerInput } from "../../../shared/types";
import { ARENA_HEIGHT, ARENA_WIDTH, MATCH_TILE_PX } from "../offline/constants";
import { getMatchSceneConfig } from "./MatchScene";
import { ARENA_SCENE_BACKGROUND } from "./vecindadArenaTheme";

export interface PhaserMatchViewProps {
  snapshot: MatchSnapshot | null;
  getSnapshot?: () => MatchSnapshot | null;
  onInput?: (input: PlayerInput) => void;
}

export function PhaserMatchView({ snapshot, getSnapshot: getSnapshotProp, onInput }: PhaserMatchViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef<MatchSnapshot | null>(null);
  const getSnapshotRef = useRef<() => MatchSnapshot | null>(() => null);
  const onInputRef = useRef<(input: PlayerInput) => void>(() => {});
  const gameRef = useRef<Phaser.Game | null>(null);

  snapshotRef.current = snapshot;
  getSnapshotRef.current = getSnapshotProp ?? (() => snapshotRef.current);
  onInputRef.current = onInput ?? (() => {});

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const getSnapshot = () => getSnapshotRef.current?.() ?? null;
    const onInputCallback = (input: PlayerInput) => onInputRef.current(input);

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: ARENA_WIDTH * MATCH_TILE_PX,
      height: ARENA_HEIGHT * MATCH_TILE_PX,
      parent,
      backgroundColor: ARENA_SCENE_BACKGROUND,
      dom: {
        createContainer: true,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      callbacks: {
        preBoot(game: Phaser.Game) {
          game.registry.set("getSnapshot", getSnapshot);
          game.registry.set("onInput", onInputCallback);
        },
      },
      scene: [
        {
          key: "Boot",
          create() {
            const getSnapshot = this.registry.get("getSnapshot") as () => MatchSnapshot | null;
            const onInputCallback = this.registry.get("onInput") as (input: PlayerInput) => void;
            this.scene.start("Match", { getSnapshot, onInput: onInputCallback });
          },
        },
        getMatchSceneConfig(),
      ],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full min-h-[300px]" />;
}
