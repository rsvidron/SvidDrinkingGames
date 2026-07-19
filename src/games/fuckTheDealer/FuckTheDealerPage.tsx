import { useRef, useState } from "react";
import { FuckTheDealerSetup } from "./FuckTheDealerSetup";
import { FuckTheDealerGame } from "./FuckTheDealerGame";
import type { FtdSharedState } from "./sharedState";
import type { FtdSettings } from "./types";

export function FuckTheDealerPage() {
  const [settings, setSettings] = useState<FtdSettings | null>(null);
  const publishRef = useRef<((state: FtdSharedState) => void) | null>(null);

  if (!settings) {
    return (
      <FuckTheDealerSetup
        onStart={(s, publish) => {
          publishRef.current = publish;
          setSettings(s);
        }}
      />
    );
  }

  return (
    <FuckTheDealerGame
      key={JSON.stringify(settings)}
      settings={settings}
      publish={(state) => publishRef.current?.(state)}
      onRestart={() => setSettings(null)}
    />
  );
}
