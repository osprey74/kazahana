// BSAF Protocol v1 Type Definitions

export interface BsafTag {
  protocol: string; // "bsaf:v1"
  type: string;
  value: string;
  time: string; // ISO 8601
  target: string;
  source: string;
}

export interface BsafPost {
  id: string;
  text: string;
  tags: string[];
  langs: string[];
  createdAt: string;
  author: {
    handle: string;
    displayName: string;
    avatar?: string;
  };
  // Parsed BSAF data (populated by client)
  bsaf?: BsafTag;
}

export interface BotDefinitionFilter {
  tag: string;
  label: string;
  options: {
    value: string;
    label: string;
  }[];
}

export interface BotDefinition {
  bsaf_schema: string;
  updated_at: string;
  self_url: string;
  bot: {
    handle: string;
    did: string;
    name: string;
    description: string;
    source: string;
    source_url: string;
  };
  filters: BotDefinitionFilter[];
}

export interface FilterState {
  [tag: string]: Set<string>;
}
