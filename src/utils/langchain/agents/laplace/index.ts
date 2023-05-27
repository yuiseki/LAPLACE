import { LLMChain } from "langchain/chains";
import { BaseLanguageModel } from "langchain/dist/base_language";
import { Tool } from "langchain/tools";
import { LaplaceAgentPromptTemplate } from "./prompt.js";

export const loadLaplaceAgentChain = ({
  llm,
  tools,
}: {
  llm: BaseLanguageModel;
  tools: Tool[];
}): LLMChain => {
  const chain = new LLMChain({
    llm: llm,
    prompt: new LaplaceAgentPromptTemplate({
      tools,
      inputVariables: ["input", "agent_scratchpad"],
    }),
  });
  return chain;
};
