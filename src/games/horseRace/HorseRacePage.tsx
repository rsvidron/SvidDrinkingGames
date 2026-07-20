import { useState } from "react";
import { HorseRaceSetup } from "./HorseRaceSetup";
import { HorseRaceGame } from "./HorseRaceGame";
import type { HrSettings } from "./types";

export function HorseRacePage() {
  const [settings, setSettings] = useState<HrSettings | null>(null);
  const [resetKey, setResetKey] = useState(0);

  if (!settings) {
    return <HorseRaceSetup onStart={setSettings} />;
  }

  return (
    <HorseRaceGame
      key={`${JSON.stringify(settings)}-${resetKey}`}
      settings={settings}
      onMenuRestart={() => setResetKey((k) => k + 1)}
    />
  );
}
