import type { CatalogSeed } from "../seed-types.js";
import {
  agentLoopSymbols,
  agentLoopCapabilities,
  agentLoopFlows,
  agentLoopFlowSteps,
  agentLoopEvidence,
  agentLoopSnippets,
  agentLoopRelationships,
} from "./agent-loop.js";
import { extraCapabilities, extraFindings, extraOpenQuestions } from "./capabilities-extra.js";
import { eventDataTypes, seedEvents } from "./events.js";
import { files } from "./files.js";
import {
  persistenceEntities,
  memorySystems,
  memoryCapabilities,
  memorySessionFlows,
  memorySessionFlowSteps,
  memorySessionEvidence,
  memorySessionOpenQuestions,
} from "./memory-sessions.js";
import { modules } from "./modules.js";
import {
  oauthSymbols,
  oauthCapabilities,
  oauthFlows,
  oauthFlowSteps,
  oauthEvidence,
  oauthOpenQuestions,
  oauthDataTypes,
} from "./oauth.js";
import {
  providerSymbols,
  providerCapabilities,
  providerFlows,
  providerFlowSteps,
  providerEvidence,
  providerSnippets,
  providerDataTypes,
  providerFindings,
  providerRelationships,
} from "./providers.js";
import { repository } from "./repository.js";
import {
  sandboxFiles,
  sandboxModules,
  sandboxSymbols,
  sandboxDataTypes,
  sandboxEvidence,
  sandboxFindings,
  sandboxOpenQuestions,
} from "./sandbox.js";
import {
  skillSymbols,
  skillDataTypes,
  seedSkills,
  skillFlows,
  skillFlowSteps,
  skillFindings,
  skillEvidence,
  skillOpenQuestions,
} from "./skills.js";
import {
  toolCapabilities,
  toolFlows,
  toolFlowSteps,
  toolDataTypes,
  seedTools,
  toolEvidence,
  toolOpenQuestions,
  toolSymbols,
} from "./tools.js";

export function buildCatalogSeed(): CatalogSeed {
  return {
    repository,
    files: [...files, ...sandboxFiles],
    modules: [...modules, ...sandboxModules],
    symbols: [
      ...agentLoopSymbols,
      ...providerSymbols,
      ...oauthSymbols,
      ...toolSymbols,
      ...sandboxSymbols,
      ...skillSymbols,
    ],
    capabilities: [
      ...agentLoopCapabilities,
      ...providerCapabilities,
      ...oauthCapabilities,
      ...toolCapabilities,
      ...memoryCapabilities,
      ...extraCapabilities,
    ],
    evidence: [
      ...agentLoopEvidence,
      ...providerEvidence,
      ...oauthEvidence,
      ...toolEvidence,
      ...skillEvidence,
      ...memorySessionEvidence,
      ...sandboxEvidence,
    ],
    relationships: [...agentLoopRelationships, ...providerRelationships],
    flows: [
      ...agentLoopFlows,
      ...providerFlows,
      ...oauthFlows,
      ...toolFlows,
      ...memorySessionFlows,
      ...skillFlows,
    ],
    flowSteps: [
      ...agentLoopFlowSteps,
      ...providerFlowSteps,
      ...oauthFlowSteps,
      ...toolFlowSteps,
      ...memorySessionFlowSteps,
      ...skillFlowSteps,
    ],
    dataTypes: [
      ...providerDataTypes,
      ...toolDataTypes,
      ...skillDataTypes,
      ...eventDataTypes,
      ...sandboxDataTypes,
      ...oauthDataTypes,
    ],
    events: seedEvents,
    tools: seedTools,
    skills: seedSkills,
    memorySystems,
    persistenceEntities,
    snippets: [...agentLoopSnippets, ...providerSnippets],
    findings: [...providerFindings, ...extraFindings, ...sandboxFindings, ...skillFindings],
    openQuestions: [
      ...oauthOpenQuestions,
      ...toolOpenQuestions,
      ...skillOpenQuestions,
      ...memorySessionOpenQuestions,
      ...extraOpenQuestions,
      ...sandboxOpenQuestions,
    ],
  };
}
