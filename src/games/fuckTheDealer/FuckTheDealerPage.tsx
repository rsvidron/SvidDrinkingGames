import { useState } from "react";
import { useHostRoom } from "../../lib/sharedRoom";
import { FuckTheDealerSetup } from "./FuckTheDealerSetup";
import { FuckTheDealerGame } from "./FuckTheDealerGame";
import type { FtdSharedState } from "./sharedState";
import type { FtdSettings } from "./types";

export function FuckTheDealerPage() {
  const [settings, setSettings] = useState<FtdSettings | null>(null);
  const room = useHostRoom<FtdSharedState>("fuck-the-dealer", true);

  if (!settings) {
    return (
      <FuckTheDealerSetup
        room={room}
        onStart={(s) => setSettings(s)}
      />
    );
  }

  return (
    <FuckTheDealerGame
      key={JSON.stringify(settings)}
      settings={settings}
      publish={room.publish}
      onRestart={() => setSettings(null)}
    />
  );
}
