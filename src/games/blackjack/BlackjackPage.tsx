import { useState } from "react";
import { BlackjackSetup } from "./BlackjackSetup";
import { BlackjackGame } from "./BlackjackGame";
import type { BlackjackSettings } from "./types";

export function BlackjackPage() {
  const [settings, setSettings] = useState<BlackjackSettings | null>(null);
  const [resetKey, setResetKey] = useState(0);

  if (!settings) {
    return <BlackjackSetup onStart={setSettings} />;
  }

  return (
    <BlackjackGame
      key={`${JSON.stringify(settings)}-${resetKey}`}
      settings={settings}
      onMenuRestart={() => setResetKey((k) => k + 1)}
    />
  );
}
