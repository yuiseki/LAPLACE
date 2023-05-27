import * as dotenv from "dotenv";
dotenv.config();

import { AgentAction, AgentStep } from "langchain/schema";
import { OpenAI } from "langchain/llms/openai";
import { AgentExecutor, LLMSingleActionAgent } from "langchain/agents";

import { Wikipedia } from "../src/utils/langchain/tools/wikipedia/index.ts";
/*
import { loadResolutionChainTool } from "../../../src/utils/langchain/tools/resolutions/index.ts";
import { loadSituationChainTool } from "../../../src/utils/langchain/tools/situations/index.ts";
import { loadSummarizationChainTool } from "../../../src/utils/langchain/tools/summarization/index.ts";
import { loadDateTimeChainTool } from "../../../src/utils/langchain/tools/datetime/index.ts";
import { ReliefWeb } from "../../../src/utils/langchain/tools/reliefweb/index.ts";
*/

import { loadLaplaceAgentChain } from "../src/utils/langchain/agents/laplace/index.ts";
import { LaplaceOutputParser } from "../src/utils/langchain/agents/laplace/parser.ts";

const llm = new OpenAI({ temperature: 0 });
const tools = [new Wikipedia()];
const llmChain = loadLaplaceAgentChain({ llm, tools });

const input = "How old is the current UN Secretary General?";
//const input = "Who is the current Secretary General of the United Nations?";

const outputParser = new LaplaceOutputParser();
const firstResult = await llmChain.call({
  input: input,
  agent_scratchpad: "",
  stop: ["\nObservation"],
  intermediate_steps: [],
});

console.log("\n----- ----- ----- ----- ----- -----\n");
console.log("Q:", input);

let result = firstResult;
const steps = [];

while (true) {
  const output = (await outputParser.parse(result.text)) as AgentAction;
  if ("returnValues" in output) {
    console.log("----- -----");
    console.log("Final Answer:", output.returnValues);
    console.log("----- -----");
    break;
  }

  const actions = [output as AgentAction];
  const action = actions[0];
  const observation = await tools[0].call({ input: action.toolInput });
  const step = { action, observation };
  steps.push(step);

  const agentScratchpad = steps.reduce(
    (thoughts, { action, observation }) =>
      thoughts +
      [action.log, `\nObservation: ${observation}`, "Thought:"]
        .join("\n")
        .replace("\n\n", "\n"),
    ""
  );
  console.log("----- -----");
  console.log("agentScratchpad:", agentScratchpad);
  console.log("----- -----");

  const actionResult = await llmChain.call({
    input: input,
    agent_scratchpad: agentScratchpad,
    stop: ["\nObservation"],
    intermediate_steps: [],
  });
  console.log("----- -----");
  console.log("resultText:", actionResult.text);
  console.log("----- -----");
  result = actionResult;
  console.log("\n----- ----- ----- ----- ----- -----\n");
}
