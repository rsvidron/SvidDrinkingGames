import { useState } from "react";
import { useHostRoom } from "../../lib/sharedRoom";
import { FuckTheDealerSetup } from "./FuckTheDealerSetup";
import { FuckTheDealerGame } from "./FuckTheDealerGame";
import type { FtdSharedState } from "./sharedState";

export function FuckTheDealerPage() {
  const [started, setStarted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const room = useHostRoom<FtdSharedState>("fuck-the-dealer", true);

  if (!started) {
    return <FuckTheDealerSetup room={room} onStart={() => setStarted(true)} />;
  }

  return (
    <FuckTheDealerGame
      key={gameKey}
      publish={room.publish}
      onRestart={() => setGameKey((k) => k + 1)}
    />
  );
}
