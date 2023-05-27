import { ConversationChain } from "langchain/chains";
import { LAPLACE_SURFACE_PROMPT } from "./prompt";
import { LLMChain } from "langchain/chains";
import { BaseLanguageModel } from "langchain/dist/base_language";
import { BaseMemory, BufferMemory } from "langchain/memory";

export const loadGeoAISurfaceChain = ({
  llm,
  memory,
}: {
  llm: BaseLanguageModel;
  memory?: BaseMemory;
}): LLMChain => {
  if (memory === undefined) {
    memory = new BufferMemory();
  }
  const chain = new ConversationChain({
    llm: llm,
    prompt: LAPLACE_SURFACE_PROMPT,
    memory: memory,
  });
  return chain;
};
