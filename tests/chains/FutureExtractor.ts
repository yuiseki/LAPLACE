import * as dotenv from "dotenv";
dotenv.config();

import { OpenAI } from "langchain/llms/openai";
import { loadFutureExtractorChain } from "../../src/utils/langchain/chains/FutureExtractor/index.ts";
import { Document } from "langchain/document";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

const llm = new OpenAI({ temperature: 0 });
const chain = loadFutureExtractorChain({ llm });

const nextWeekNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E6%9D%A5%E9%80%B1%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=5";
const nextMonthNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E6%9D%A5%E6%9C%88%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=15";
const nextYearNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E6%9D%A5%E5%B9%B4%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30";

const futuresTokyoNhkNewsUrl = [
  nextWeekNhkNewsUrl,
  nextMonthNhkNewsUrl,
  nextYearNhkNewsUrl,
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

const docs: Document[] = [];
for await (const newsItem of newsItems) {
  try {
    const text = `${newsItem.pubDate.split(" ")[0]} 配信
${newsItem.title}
${newsItem.description}`;
    console.log("----- ----- ----- ----- -----");
    console.log("Input text:");
    console.log(text);
    console.log("");
    const result = await chain.call({ text });
    console.log("Output text:", result.text);
    const lines: string[] = result.text.split("\n");
    const currentDate = lines
      .filter((line) => line.includes("CurrentDate:"))[0]
      .split(": ")[1];
    const futureNearDate = lines
      .filter((line) => line.includes("FutureNearDate:"))[0]
      .split(": ")[1];
    const futureFarDate = lines
      .filter((line) => line.includes("FutureFarDate:"))[0]
      .split(": ")[1];
    const futureIndicateExpression = lines
      .filter((line) => line.includes("FutureIndicateExpression:"))[0]
      .split(": ")[1];
    const whatHappens = lines
      .filter((line) => line.includes("WhatHappens:"))[0]
      .split(": ")[1];
    const pageContent = `${futureIndicateExpression}、${whatHappens}`;
    const metadata = {
      url: `https://www3.nhk.or.jp/news/${newsItem.link}`,
      title: newsItem.title,
      description: newsItem.description,
      pubDate: new Date(newsItem.pubDate),
      currentDate: new Date(currentDate),
      futureNearDate: new Date(futureNearDate),
      futureFarDate: new Date(futureFarDate),
      futureIndicateExpression,
      whatHappens,
    };
    console.log("");
    console.log("pageContent:", pageContent);
    console.log("metadata", metadata);
    console.log("----- ----- ----- ----- -----");
    const doc = new Document({
      pageContent: pageContent,
      metadata: metadata,
    });
    docs.push(doc);
  } catch (error) {
    console.error(error);
  }
}

const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
const directory = "public/data/www3.nhk.or.jp/vector_stores/";
await vectorStore.save(directory);
