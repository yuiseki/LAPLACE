import * as dotenv from "dotenv";
dotenv.config();

import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { loadSummarizationChain } from "langchain/chains";

import fs from "node:fs/promises";

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

/*
for await (const event of sortedFutureEvents) {
  const futureNearDate = new Date(event.futureNearDate);
  const futureFarDate = new Date(event.futureFarDate);
  const whatHappens = event.whatHappens;
  console.log(
    `${formatDate(futureNearDate)} / ${formatDate(
      futureFarDate
    )}: ${whatHappens}`
  );
}
*/

const now = new Date();
const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
const nextYearStart = new Date(now.getFullYear() + 1, 0, 1);
const nextYearEnd = new Date(now.getFullYear() + 2, 0, 0);

const predictFuture = async (start: Date, end: Date) => {
  const filteredFutureEvents = sortedFutureEvents.filter((event) => {
    return (
      start.getTime() <= new Date(event.futureNearDate).getTime() &&
      new Date(event.futureNearDate).getTime() <= end.getTime()
    );
  });
  let future = "";
  for await (const event of filteredFutureEvents) {
    const futureNearDate = new Date(event.futureNearDate);
    const futureFarDate = new Date(event.futureFarDate);
    const whatHappens = event.whatHappens;
    future += `${formatDate(futureNearDate)}から${formatDate(
      futureFarDate
    )}まで: ${whatHappens}\n`;
  }
  return future;
};

console.log("来月の未来予報");
console.log("開始:", formatDate(nextMonthStart));
console.log("終了:", formatDate(nextMonthEnd));
const nextMonthFuture = await predictFuture(nextMonthStart, nextMonthEnd);
console.log(nextMonthFuture);

console.log("年内の未来予報");
console.log("開始:", formatDate(nextMonthStart));
console.log("終了:", formatDate(nextYearStart));
const thisYearFuture = await predictFuture(nextMonthStart, nextYearStart);
console.log(thisYearFuture);

console.log("来年の未来予報");
console.log("開始:", formatDate(nextYearStart));
console.log("終了:", formatDate(nextYearEnd));
const nextYearFuture = await predictFuture(nextYearStart, nextYearEnd);
console.log(nextYearFuture);
