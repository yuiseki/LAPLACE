import { JsonToolkit, createJsonAgent } from "langchain/agents";
import { OpenAI } from "langchain/llms/openai";
import { JsonListKeysTool, JsonSpec } from "langchain/tools";

const jpPopApiUrl =
  "http://api.worldbank.org/v2/country/jp/indicator/SP.POP.TOTL?format=json&per_page=100";

const jpGdpApiUrl =
  "http://api.worldbank.org/v2/country/jp/indicator/NY.GDP.MKTP.CD?format=json&per_page=100";

const jpGdpApiRes = await fetch(jpGdpApiUrl);
const jpGdpApiResJson = await jpGdpApiRes.json();

const rows = jpGdpApiResJson[1]
  .map((row: any) => {
    const date = row.date;
    const value = row.value;
    const expr = value ? `${date}: ${value}` : `${date}: `;
    return expr;
  })
  .reverse()
  .join("\n");

console.log(rows);
