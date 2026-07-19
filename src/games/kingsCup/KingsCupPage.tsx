import { useState } from "react";
import { KingsCupSetup } from "./KingsCupSetup";
import { KingsCupGame } from "./KingsCupGame";
import type { KcSettings } from "./types";

export function KingsCupPage() {
  const [settings, setSettings] = useState<KcSettings | null>(null);
  const [resetKey, setResetKey] = useState(0);

  if (!settings) {
    return <KingsCupSetup onStart={setSettings} />;
  }

  return (
    <KingsCupGame
      key={`${JSON.stringify(settings)}-${resetKey}`}
      settings={settings}
      onRestart={() => setSettings(null)}
      onMenuRestart={() => setResetKey((k) => k + 1)}
    />
  );
}
