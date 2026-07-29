import { agentLoopSymbols, agentLoopCapabilities, agentLoopFlows, agentLoopFlowSteps, agentLoopEvidence, agentLoopSnippets, agentLoopRelationships, } from "./agent-loop.js";
import { extraCapabilities, extraFindings, extraOpenQuestions } from "./capabilities-extra.js";
import { eventDataTypes, seedEvents } from "./events.js";
import { files } from "./files.js";
import { persistenceEntities, memorySystems, memoryCapabilities, memorySessionFlows, memorySessionFlowSteps, memorySessionEvidence, memorySessionOpenQuestions, } from "./memory-sessions.js";
import { modules } from "./modules.js";
import { oauthSymbols, oauthCapabilities, oauthFlows, oauthFlowSteps, oauthEvidence, oauthOpenQuestions, } from "./oauth.js";
import { providerSymbols, providerCapabilities, providerFlows, providerFlowSteps, providerEvidence, providerSnippets, providerDataTypes, providerFindings, providerRelationships, } from "./providers.js";
import { repository } from "./repository.js";
import { skillDataTypes, seedSkills, skillEvidence, skillOpenQuestions } from "./skills.js";
import { toolCapabilities, toolFlows, toolFlowSteps, toolDataTypes, seedTools, toolEvidence, toolOpenQuestions, } from "./tools.js";
export function buildCatalogSeed() {
    return {
        repository,
        files,
        modules,
        symbols: [...agentLoopSymbols, ...providerSymbols, ...oauthSymbols],
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
        ],
        relationships: [...agentLoopRelationships, ...providerRelationships],
        flows: [
            ...agentLoopFlows,
            ...providerFlows,
            ...oauthFlows,
            ...toolFlows,
            ...memorySessionFlows,
        ],
        flowSteps: [
            ...agentLoopFlowSteps,
            ...providerFlowSteps,
            ...oauthFlowSteps,
            ...toolFlowSteps,
            ...memorySessionFlowSteps,
        ],
        dataTypes: [...providerDataTypes, ...toolDataTypes, ...skillDataTypes, ...eventDataTypes],
        events: seedEvents,
        tools: seedTools,
        skills: seedSkills,
        memorySystems,
        persistenceEntities,
        snippets: [...agentLoopSnippets, ...providerSnippets],
        findings: [...providerFindings, ...extraFindings],
        openQuestions: [
            ...oauthOpenQuestions,
            ...toolOpenQuestions,
            ...skillOpenQuestions,
            ...memorySessionOpenQuestions,
            ...extraOpenQuestions,
        ],
    };
}
