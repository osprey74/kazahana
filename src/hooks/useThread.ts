import { useQuery } from "@tanstack/react-query";
import { getAgent } from "../lib/agent";

export function useThread(uri: string) {
  return useQuery({
    queryKey: ["thread", uri],
    queryFn: async () => {
      const agent = getAgent();
      const res = await agent.getPostThread({ uri, depth: 10 });
      return res.data.thread;
    },
    enabled: !!uri,
    staleTime: 30_000,
  });
}
