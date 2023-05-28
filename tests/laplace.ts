import * as dotenv from "dotenv";
dotenv.config();

import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import {
  RetrievalQAChain,
  loadQAMapReduceChain,
  loadQAStuffChain,
  loadSummarizationChain,
} from "langchain/chains";

import fs from "node:fs/promises";
import { Document } from "langchain/document";

const formatDate = (date: Date) => {
  return date
    .toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("/")
    .join("-");
};

const futureEventsLatestJsonFilePath =
  "public/data/www3.nhk.or.jp/future_events/latest_events.json";
const futureEventsJsonFile = await fs.readFile(
  futureEventsLatestJsonFilePath,
  "utf-8"
);
const futureEvents = JSON.parse(futureEventsJsonFile);

const validFutureEvents = [];
for await (const futureEvent of futureEvents) {
  if (
    futureEvent.futureNearDate === "Unknown" ||
    futureEvent.futureFarDate === "Unknown" ||
    futureEvent.futureNearDate === null ||
    futureEvent.futureFarDate === null
  ) {
    continue;
  }
  if (
    futureEvent.whatHappens.includes("選手") ||
    futureEvent.whatHappens.includes("試合") ||
    futureEvent.whatHappens.includes("優勝") ||
    futureEvent.whatHappens.includes("アジアカップ")
  ) {
    continue;
  }
  validFutureEvents.push(futureEvent);
}
console.log(validFutureEvents.length);

const sortedFutureEvents = validFutureEvents.sort((a, b) => {
  if (a.futureNearDate !== b.futureNearDate) {
    return (
      new Date(a.futureNearDate).getTime() -
      new Date(b.futureNearDate).getTime()
    );
  } else {
    return (
      new Date(a.futureFarDate).getTime() - new Date(b.futureFarDate).getTime()
    );
  }
});

const now = new Date();
const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
const nextYearStart = new Date(now.getFullYear() + 1, 0, 1);
const nextYearEnd = new Date(now.getFullYear() + 2, 0, 0);

const futureForecast = async (start: Date, end: Date) => {
  const filteredFutureEvents = sortedFutureEvents.filter((event) => {
    return (
      start.getTime() <= new Date(event.futureNearDate).getTime() &&
      new Date(event.futureNearDate).getTime() <= end.getTime()
    );
  });
  const docs: Document[] = [];
  //future += `本日は${formatDate(now)}である。\n`;
  for await (const event of filteredFutureEvents) {
    const futureNearDate = new Date(event.futureNearDate);
    const futureFarDate = new Date(event.futureFarDate);
    const whatHappens = event.whatHappens;
    const newFuture = `${formatDate(futureNearDate)}から${formatDate(
      futureFarDate
    )}の間に、${whatHappens}`;
    console.log(newFuture);
    docs.push(new Document({ pageContent: newFuture }));
  }
  return docs;
};

console.log("年内の未来予報");
console.log("開始:", formatDate(nextMonthStart));
console.log("終了:", formatDate(nextYearEnd));
const thisYearFutureForecast = await futureForecast(
  nextMonthStart,
  nextYearEnd
);
console.log(thisYearFutureForecast.length);

/*
console.log("来月の未来予報");
console.log("開始:", formatDate(nextMonthStart));
console.log("終了:", formatDate(nextMonthEnd));
const nextMonthFutureForecast = await futureForecast(
  nextMonthStart,
  nextMonthEnd
);
console.log(nextMonthFutureForecast);

console.log("年内の未来予報");
console.log("開始:", formatDate(nextMonthStart));
console.log("終了:", formatDate(nextYearStart));
const thisYearFutureForecast = await futureForecast(
  nextMonthStart,
  nextYearStart
);
console.log(thisYearFutureForecast);

console.log("来年の未来予報");
console.log("開始:", formatDate(nextYearStart));
console.log("終了:", formatDate(nextYearEnd));
const nextYearFutureForecast = await futureForecast(nextYearStart, nextYearEnd);
console.log(nextYearFutureForecast);
*/

const embeddings = new OpenAIEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(
  thisYearFutureForecast,
  embeddings
);

const llm = new OpenAI({ temperature: 0, maxTokens: 2000 });
const chain = RetrievalQAChain.fromLLM(llm, vectorStore.asRetriever(20));
const questions = [
  "今後、経済的に最も注目するべき出来事を教えてください",
  "今後、日本の政治で最も注目するべき出来事を教えてください",
  "今後、軍事情勢で最も注目するべき出来事を教えてください",
  "今後、テクノロジー関係で最も注目するべき出来事を教えてください",
  "いま投資をする場合に予想される大きなリスクを教えてください",
  "エネルギー価格は今後どうなりますか？",
  "少子化問題は今後どうなりますか？",
];
for await (const question of questions) {
  console.log("----- ----- ----- -----");
  console.log("Q:", question);
  const result = await chain.call({
    query: `今日は${formatDate(now)}です。${question}`,
  });
  console.log("A:", result.text);
  console.log("----- ----- ----- -----");
}
