"use client";

import { useEffect, useState } from "react";

export interface ApplyAssistantCapabilities {
  installed: boolean;
  directApplyEnabled: boolean;
}

export function detectApplyAssistant(timeoutMs = 650) {
  return new Promise<ApplyAssistantCapabilities>((resolve) => {
    const requestId = crypto.randomUUID();
    let settled = false;
    const finish = (capabilities: ApplyAssistantCapabilities) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve(capabilities);
    };
    const onMessage = (event: MessageEvent) => {
      if (
        event.source === window &&
        event.origin === window.location.origin &&
        event.data?.type === "JOBMATES_EXTENSION_PONG" &&
        event.data?.requestId === requestId
      )
        finish({
          installed: true,
          directApplyEnabled: event.data.directApplyEnabled === true,
        });
    };
    const timeout = window.setTimeout(
      () => finish({ installed: false, directApplyEnabled: false }),
      timeoutMs,
    );
    window.addEventListener("message", onMessage);
    window.postMessage(
      { type: "JOBMATES_EXTENSION_PING", requestId },
      window.location.origin,
    );
  });
}

export function useApplyAssistant() {
  const [capabilities, setCapabilities] =
    useState<ApplyAssistantCapabilities | null>(null);

  useEffect(() => {
    let active = true;
    void detectApplyAssistant().then((detected) => {
      if (active) setCapabilities(detected);
    });
    return () => {
      active = false;
    };
  }, []);

  return capabilities;
}
