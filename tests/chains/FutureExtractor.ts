import * as dotenv from "dotenv";
dotenv.config();

import { OpenAI } from "langchain/llms/openai";
import { loadFutureExtractorChain } from "../../src/utils/langchain/chains/FutureExtractor/index.ts";

import fs from "node:fs/promises";
import { exit } from "node:process";

// 来週
const nextWeekNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E6%9D%A5%E9%80%B1%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=15";
// 来月
const nextMonthNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E6%9D%A5%E6%9C%88%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30";
// ことし
const thisYearNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E3%81%93%E3%81%A8%E3%81%97%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30";
// 来年
const nextYearNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E6%9D%A5%E5%B9%B4%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=80";
// 予定
const futureScheduleNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E4%BA%88%E5%AE%9A%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=60";
// 以内
const futureWithinNhkNewsUrl =
  "https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E4%BB%A5%E5%86%85%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=20";

//
// 検索ワード候補
//
// まで
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E3%81%BE%E3%81%A7%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// ↑検索できない。なぜ？
// 延長
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E5%BB%B6%E9%95%B7%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// ↑ノイズが多い。未来の日時を確定しづらい
// 開始
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E9%96%8B%E5%A7%8B%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
//
// 延期
// 見送り
// 見通し
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E8%A6%8B%E9%80%9A%E3%81%97%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// 年末
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E5%B9%B4%E6%9C%AB%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// 年度末
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E5%B9%B4%E5%BA%A6%E6%9C%AB%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// 以降
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E4%BB%A5%E9%99%8D%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// ↑過去の情報のほうが多い
// 今後
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E4%BB%8A%E5%BE%8C%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// ↑意外とダメ
// 継続
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E7%B6%99%E7%B6%9A%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// 発表
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E7%99%BA%E8%A1%A8%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// 計画
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E8%A8%88%E7%94%BB%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// 取りやめ
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E5%8F%96%E3%82%8A%E3%82%84%E3%82%81%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// 中止
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E4%B8%AD%E6%AD%A2%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30
// 廃止
// https://noa-api.nhk.jp/r1/db/_search?q=%28%22%E5%BB%83%E6%AD%A2%22%29&index=news&fields=title%2Cdescription&_source=link%2CpubDate%2Ctitle%2Cdescription&sortkey=pubDate&order=desc&from=0&limit=30

const futuresTokyoNhkNewsUrl = [
  futureWithinNhkNewsUrl,
  futureScheduleNhkNewsUrl,
  nextYearNhkNewsUrl,
  nextMonthNhkNewsUrl,
  thisYearNhkNewsUrl,
  nextWeekNhkNewsUrl,
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

const uniqueNewsItems: Array<{
  link: string;
  description: string;
  title: string;
  pubDate: string;
}> = newsItems.filter(
  (element, index, self) =>
    self.findIndex((e) => e.link === element.link) === index
);

console.log(uniqueNewsItems.length);

const futureEventsLatestJsonFilePath =
  "public/data/www3.nhk.or.jp/future_events/latest_events.json";
const now = new Date();
const today = now
  .toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  .split("/")
  .join("-");
const futureEventsTodayJsonFilePath = `public/data/www3.nhk.or.jp/future_events/${today}_events.json`;
try {
  const alreadyFutureExtracted = (
    await fs.lstat(futureEventsTodayJsonFilePath)
  ).isFile();
  if (alreadyFutureExtracted) {
    console.log("already extracted, finish:", futureEventsTodayJsonFilePath);
    exit(0);
  }
} catch (error) {
  console.log("not yet extracted:", futureEventsTodayJsonFilePath);
}

const llm = new OpenAI({ temperature: 0, maxConcurrency: 10 });
const chain = loadFutureExtractorChain({ llm });

const predictFuture = async (newsItem: {
  link: string;
  description: string;
  title: string;
  pubDate: string;
}) => {
  try {
    const info = `${newsItem.title}, ${newsItem.description}`;
    if (
      info.includes("選手") ||
      info.includes("試合") ||
      info.includes("優勝") ||
      info.includes("野球") ||
      info.includes("サッカー") ||
      info.includes("アジアカップ") ||
      info.includes("オリンピック") ||
      info.includes("シミュレーション")
    ) {
      return;
    }
    const text = `${newsItem.pubDate.split(" ")[0]} 配信。${
      newsItem.description
    }`;
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
    const futureEvent = {
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
    console.log("futureEvent:", futureEvent);
    console.log("----- ----- ----- ----- -----");
    return futureEvent;
  } catch (error) {
    console.error(error);
  }
};

const futureEvents = await Promise.all(
  newsItems.map((newsItem) => predictFuture(newsItem))
);

console.log(futureEvents.length);

await fs.writeFile(
  futureEventsLatestJsonFilePath,
  JSON.stringify(futureEvents, null, 2)
);

await fs.writeFile(
  futureEventsTodayJsonFilePath,
  JSON.stringify(futureEvents, null, 2)
);
