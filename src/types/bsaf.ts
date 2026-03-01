/** BSAF Bot Definition JSON schema */
export interface BsafBotDefinition {
  bsaf_schema: string;
  updated_at: string;
  self_url: string;

  bot: {
    handle: string;
    did: string;
    name: string;
    description: string;
    source: string;
    source_url?: string;
  };

  filters: BsafFilter[];
}

export interface BsafFilter {
  tag: string;
  label: string;
  options: BsafFilterOption[];
}

export interface BsafFilterOption {
  value: string;
  label: string;
}

/** Registered bot stored in bsafStore */
export interface BsafRegisteredBot {
  definition: BsafBotDefinition;
  /** key = filter.tag, value = enabled option values */
  filterSettings: Record<string, string[]>;
  registeredAt: string;
  lastCheckedAt: string;
}

/** Parsed BSAF tags from a post */
export interface BsafParsedTags {
  version: string;
  type: string;
  value: string;
  time: string;
  target: string;
  source: string;
}
