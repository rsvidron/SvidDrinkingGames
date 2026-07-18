import { useState } from "react";
import { FuckTheDealerSetup } from "./FuckTheDealerSetup";
import { FuckTheDealerGame } from "./FuckTheDealerGame";
import type { FtdSettings } from "./types";

export function FuckTheDealerPage() {
  const [settings, setSettings] = useState<FtdSettings | null>(null);

  if (!settings) {
    return <FuckTheDealerSetup onStart={setSettings} />;
  }

  return (
    <FuckTheDealerGame
      key={JSON.stringify(settings)}
      settings={settings}
      onRestart={() => setSettings(null)}
    />
  );
}
