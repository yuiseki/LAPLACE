import * as dotenv from "dotenv";
dotenv.config();

import { OpenAI } from "langchain/llms/openai";
import { loadFutureExtractorChain } from "../../src/utils/langchain/chains/FutureExtractor/index.ts";
import { load } from "cheerio";

const llm = new OpenAI({ temperature: 0 });
const chain = loadFutureExtractorChain({ llm });

const nextWeekTokyoNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E6%9D%A5%E9%80%B1%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=5";
const nextMonthTokyoNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E6%9D%A5%E6%9C%88%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=5";

const futuresTokyoNhkNewsUrl = [
  nextWeekTokyoNhkNewsUrl,
  nextMonthTokyoNhkNewsUrl,
];
const newsItems: Array<{
  link: string;
  description: string;
  title: string;
  pubDate: string;
}> = [];

for await (const futureUrl of futuresTokyoNhkNewsUrl) {
  console.log("news search url:", futureUrl);
  const res = await fetch(futureUrl);
  const json = await res.json();
  for await (const result of json.result) {
    newsItems.push(result);
  }
}

console.log(newsItems.length);

for await (const newsItem of newsItems) {
  const text = `${newsItem.title}
${newsItem.pubDate.split(" ")[0]} 配信
${newsItem.description}`;
  console.log("----- ----- ----- ----- -----");
  console.log("原文:");
  console.log(text);
  const result = await chain.call({ text });
  console.log("");
  console.log("結果:");
  console.log(result.text);
  console.log("----- ----- ----- ----- -----");

}
