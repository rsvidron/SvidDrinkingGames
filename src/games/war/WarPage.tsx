import { useState } from "react";
import { WarSetup } from "./WarSetup";
import { WarGame } from "./WarGame";
import type { WarSettings } from "./types";

export function WarPage() {
  const [settings, setSettings] = useState<WarSettings | null>(null);
  const [resetKey, setResetKey] = useState(0);

  if (!settings) {
    return <WarSetup onStart={setSettings} />;
  }

  return (
    <WarGame
      key={`${JSON.stringify(settings)}-${resetKey}`}
      settings={settings}
      onMenuRestart={() => setResetKey((k) => k + 1)}
    />
  );
}
