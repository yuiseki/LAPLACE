import * as dotenv from "dotenv";
dotenv.config();

import { OpenAI } from "langchain/llms/openai";
import { JsonSpec, JsonObject } from "langchain/tools";
import { createOpenApiAgent, OpenApiToolkit } from "langchain/agents";

const aiPluginRes = await fetch(
  "https://www.wolframalpha.com/.well-known/ai-plugin.json"
);
const aiPluginJson = await aiPluginRes.json();
const aiPluginAuthToken = aiPluginJson.auth.verification_tokens.openai;

const wolframApiEndpointLlm = "https://www.wolframalpha.com/api/v1/llm-api";
const wolframApiEndpointCloud =
  "https://www.wolframalpha.com//api/v1/cloud-plugin";
const wolframRes = await fetch(wolframApiEndpointLlm, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${aiPluginAuthToken}`,
  },
  body: JSON.stringify({
    query: "Japan population in 2025",
  }),
});
const wolframResText = await wolframRes.text();

console.log(wolframResText);

/*
const apiSpecRes = await fetch(
  "https://www.wolframalpha.com/.well-known/apispec.json"
);
const apiSpecJson = await apiSpecRes.json();

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${aiPluginAuthToken}`,
};
const model = new OpenAI({ temperature: 0 });
const toolkit = new OpenApiToolkit(new JsonSpec(apiSpecJson), model, headers);
const executor = createOpenApiAgent(model, toolkit);

const input = `Make a request to Wolfram /api/v1/llm-api. The prompt should be '2025年における日本の人口を予測せよ`;
console.log(`Executing with input "${input}"...`);

const result = await executor.call({ input });
console.log(`Got output ${result.output}`);

console.log(
  `Got intermediate steps ${JSON.stringify(result.intermediateSteps, null, 2)}`
);
*/
