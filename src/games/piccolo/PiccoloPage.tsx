import { useState } from "react";
import { PiccoloSetup } from "./PiccoloSetup";
import { PiccoloGame } from "./PiccoloGame";
import type { PiccoloSettings } from "./types";

export function PiccoloPage() {
  const [settings, setSettings] = useState<PiccoloSettings | null>(null);
  const [resetKey, setResetKey] = useState(0);

  if (!settings) {
    return <PiccoloSetup onStart={setSettings} />;
  }

  return (
    <PiccoloGame
      key={`${JSON.stringify(settings)}-${resetKey}`}
      settings={settings}
      onRestart={() => setSettings(null)}
      onMenuRestart={() => setResetKey((k) => k + 1)}
    />
  );
}
