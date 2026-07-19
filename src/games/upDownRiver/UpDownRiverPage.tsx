import { useState } from "react";
import { UpDownRiverSetup } from "./UpDownRiverSetup";
import { UpDownRiverGame } from "./UpDownRiverGame";
import type { GameSettings } from "./types";

export function UpDownRiverPage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [resetKey, setResetKey] = useState(0);

  if (!settings) {
    return <UpDownRiverSetup onStart={setSettings} />;
  }

  return (
    <UpDownRiverGame
      key={`${JSON.stringify(settings)}-${resetKey}`}
      settings={settings}
      onRestart={() => setSettings(null)}
      onMenuRestart={() => setResetKey((k) => k + 1)}
    />
  );
}
