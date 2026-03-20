"use client";

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
  const s = useOnlineRoomsSession();

  if (s.inMatch && s.matchEnded) {
    return (
      <MatchEndScreen matchWinnerId={s.matchWinnerId} onBackToRooms={s.onBackToRooms} />
    );
  }

  if (s.inMatch) {
    return (
      <OnlineMatchStage
        matchSnapshot={s.matchSnapshot}
        matchGetSnapshot={s.matchGetSnapshot}
        matchOnInput={s.matchOnInput}
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
      <MatchmakingSection
        connected={s.connected}
        hasRoom={!!s.room}
        matchmakingSearching={s.matchmakingSearching}
        onMatchmakingJoin={s.onMatchmakingJoin}
        onMatchmakingLeave={s.onMatchmakingLeave}
      />
      <CreateRoomSection
        connected={s.connected}
        creating={s.creating}
        onCreateRoom={s.onCreateRoom}
      />
      <JoinByCodeSection
        joinCode={s.joinCode}
        onJoinCodeChange={s.setJoinCode}
        connected={s.connected}
        joining={s.joining}
        onJoinByCode={s.onJoinByCode}
      />
      <RoomListSection
        roomList={s.roomList}
        loadingList={s.loadingList}
        onRefresh={s.fetchRooms}
        connected={s.connected}
        joining={s.joining}
        onJoinRoom={s.onJoinRoom}
      />
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
