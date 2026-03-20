"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  ROOMS_SECTION_IDS,
  parseRoomsFocus,
} from "./constants";
import { useOnlineRoomsSession } from "./hooks/useOnlineRoomsSession";
import { CreateRoomSection } from "./components/CreateRoomSection";
import { JoinByCodeSection } from "./components/JoinByCodeSection";
import { MatchEndScreen } from "./components/MatchEndScreen";
import { MatchmakingSection } from "./components/MatchmakingSection";
import { OnlineMatchStage } from "./components/OnlineMatchStage";
import { RoomListSection } from "./components/RoomListSection";
import { RoomLobbyPanel } from "./components/RoomLobbyPanel";
import { RoomsLobbyLayout } from "./components/RoomsLobbyLayout";

export function RoomsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focus = parseRoomsFocus(searchParams.get("focus"));
  const s = useOnlineRoomsSession();

  useEffect(() => {
    if (!focus) return;
    const id = ROOMS_SECTION_IDS[focus];
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focus]);

  if (s.inMatch && s.matchEnded) {
    return (
      <MatchEndScreen
        matchWinnerId={s.matchWinnerId}
        resultsLocalPlayerId={s.resultsLocalPlayerId}
        onBackToLobby={s.leaveMatchResults}
        onPlayAgain={() => {
          s.leaveMatchResults();
          router.push("/rooms?focus=matchmaking");
        }}
        onNewRoom={() => {
          s.leaveMatchResults();
          router.push("/rooms?focus=create");
        }}
        onGoToDashboard={() => {
          s.leaveMatchResults();
          router.push("/dashboard");
        }}
      />
    );
  }

  if (s.inMatch) {
    return (
      <OnlineMatchStage
        matchSnapshot={s.matchSnapshot}
        matchGetSnapshot={s.matchGetSnapshot}
        matchOnInput={s.matchOnInput}
        localMatchPlayerId={s.localMatchPlayerId}
      />
    );
  }

  const showFooterHint = !s.room && !s.error && !s.matchmakingSearching;

  return (
    <RoomsLobbyLayout
      connected={s.connected}
      resumeReconnecting={s.resumeReconnecting}
      error={s.error}
      showFooterHint={showFooterHint}
    >
      <div
        id={ROOMS_SECTION_IDS.matchmaking}
        className={
          focus === "matchmaking"
            ? "mb-4 scroll-mt-4 rounded-lg ring-2 ring-sky-500/35 ring-offset-2 ring-offset-zinc-900"
            : "mb-0"
        }
      >
        <MatchmakingSection
          connected={s.connected}
          hasRoom={!!s.room}
          matchmakingSearching={s.matchmakingSearching}
          onMatchmakingJoin={s.onMatchmakingJoin}
          onMatchmakingLeave={s.onMatchmakingLeave}
        />
      </div>
      <div
        id={ROOMS_SECTION_IDS.create}
        className={
          focus === "create"
            ? "mb-4 scroll-mt-4 rounded-lg ring-2 ring-emerald-500/35 ring-offset-2 ring-offset-zinc-900"
            : "mb-0"
        }
      >
        <CreateRoomSection
          connected={s.connected}
          creating={s.creating}
          onCreateRoom={s.onCreateRoom}
        />
      </div>
      <JoinByCodeSection
        joinCode={s.joinCode}
        onJoinCodeChange={s.setJoinCode}
        connected={s.connected}
        joining={s.joining}
        onJoinByCode={s.onJoinByCode}
      />
      <div
        id={ROOMS_SECTION_IDS.browse}
        className={
          focus === "browse"
            ? "mb-4 scroll-mt-4 rounded-lg ring-2 ring-zinc-400/30 ring-offset-2 ring-offset-zinc-900"
            : "mb-0"
        }
      >
        <RoomListSection
          roomList={s.roomList}
          loadingList={s.loadingList}
          onRefresh={s.fetchRooms}
          connected={s.connected}
          joining={s.joining}
          onJoinRoom={s.onJoinRoom}
        />
      </div>
      {s.room && (
        <RoomLobbyPanel
          room={s.room}
          connected={s.connected}
          takenCharacterIds={s.takenCharacterIds}
          onSelectCharacter={s.onSelectCharacter}
          onMarkReady={s.onMarkReady}
          canStart={s.canStart}
          starting={s.starting}
          onStartMatch={s.onStartMatch}
          onCopyRoomId={s.copyRoomId}
        />
      )}
    </RoomsLobbyLayout>
  );
}
