export interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  role: string;
}

export const AGENTS: AgentInfo[] = [
  { id: "tarek", name: "Tarek", emoji: "⚡", role: "Lead Dev" },
  { id: "rami", name: "Rami", emoji: "🎨", role: "Frontend" },
  { id: "nadia", name: "Nadia", emoji: "🔍", role: "QA" },
  { id: "adam", name: "Adam", emoji: "🔨", role: "Builder" },
  { id: "omar", name: "Omar", emoji: "📋", role: "Blueprint" },
];

export function getAgent(id: string): AgentInfo {
  return AGENTS.find((a) => a.id === id) ?? { id, name: id, emoji: "👤", role: "" };
}
