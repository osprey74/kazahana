import { createContext, useContext } from "react";
import type { ModerationOpts } from "@atproto/api";
import { useModeration } from "../hooks/useModeration";

const ModerationContext = createContext<ModerationOpts | undefined>(undefined);

export function ModerationProvider({ children }: { children: React.ReactNode }) {
  const { moderationOpts } = useModeration();
  return (
    <ModerationContext.Provider value={moderationOpts}>
      {children}
    </ModerationContext.Provider>
  );
}

export function useModerationOpts(): ModerationOpts | undefined {
  return useContext(ModerationContext);
}
