import { useState } from "react";
import { UpDownRiverSetup } from "./UpDownRiverSetup";
import { UpDownRiverGame } from "./UpDownRiverGame";
import type { GameSettings } from "./types";

export function UpDownRiverPage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);

  if (!settings) {
    return <UpDownRiverSetup onStart={setSettings} />;
  }

  return (
    <UpDownRiverGame
      key={JSON.stringify(settings)}
      settings={settings}
      onRestart={() => setSettings(null)}
    />
  );
}
