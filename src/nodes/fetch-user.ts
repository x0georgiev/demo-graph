import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { AgentStateType, AgentStateUpdate } from "../state.js";
import { getSembleService } from "../providers/index.js";

/**
 * Node to fetch user data from Semble CRM.
 * 
 * Uses the clientId from the configuration to look up the user.
 */
export async function fetchUserNode(
  state: AgentStateType,
  config: LangGraphRunnableConfig
): Promise<AgentStateUpdate> {
  // Get the service instance (mock or real based on env)
  const sembleService = getSembleService();
  
  // Get client ID from config
  const clientId = config.configurable?.clientId;
  
  if (!clientId) {
    return {};
  }
  
  try {
    const user = await sembleService.getUser(clientId as string);
    if (user) {
      return { user };
    } else {
      return {};
    }
  } catch (error) {
    // We don't want to crash the conversation if fetching user data fails
    return {};
  }
}
