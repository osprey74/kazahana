import { useQuery } from "@tanstack/react-query";
import type { ModerationOpts } from "@atproto/api";
import { getAgent } from "../lib/agent";

export function useModeration() {
  const query = useQuery({
    queryKey: ["moderationOpts"],
    queryFn: async (): Promise<ModerationOpts> => {
      const agent = getAgent();
      const prefs = await agent.getPreferences();
      const labelDefs = await agent.getLabelDefinitions(prefs);
      return {
        userDid: agent.session?.did,
        prefs: prefs.moderationPrefs,
        labelDefs,
      };
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  return {
    moderationOpts: query.data,
    isLoading: query.isLoading,
  };
}
