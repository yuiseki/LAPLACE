import * as dotenv from "dotenv";
dotenv.config();

import { OpenAI } from "langchain/llms/openai";
import { loadFutureExtractorChain } from "../../src/utils/langchain/chains/FutureExtractor/index.ts";

import fs from "node:fs/promises";
import { exit } from "node:process";
import Parser from "rss-parser";
import { Md5 } from "ts-md5";

const allNewsFeedUrl = "https://news.un.org/feed/subscribe/en/news/all/rss.xml";
const pressFeedUrl = "https://press.un.org/en/rss.xml";

const newsFeedUrls = [allNewsFeedUrl, pressFeedUrl];

const newsItems: Array<{
  link: string;
  description: string;
  title: string;
  pubDate: string;
}> = [];

let parser = new Parser();
for await (const newsFeedUrl of newsFeedUrls) {
  console.log("news url:", newsFeedUrl);
  let feed = await parser.parseURL(newsFeedUrl);

  for await (const item of feed.items) {
    if (!item.link || !item.content || !item.title || !item.isoDate) {
      continue;
    }
    newsItems.push({
      link: item.link,
      description: item.content,
      title: item.title,
      pubDate: item.isoDate,
    });
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

const llm = new OpenAI({ temperature: 0 });
const chain = loadFutureExtractorChain({ llm });

const futureEventsLatestJsonFilePath =
  "public/data/news.un.org/future_events/latest_events.json";
const now = new Date();
const today = now
  .toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  .split("/")
  .join("-");
const futureEventsTodayJsonFilePath = `public/data/news.un.org/future_events/${today}_events.json`;

const predictFuture = async (newsItem: {
  link: string;
  description: string;
  title: string;
  pubDate: string;
}) => {
  try {
    const md5 = new Md5();
    md5.appendStr(`${newsItem.link}`);
    const hash = md5.end();
    if (!hash) {
      return;
    }
    const futureEventBaseDir = `tmp/news.un.org/${hash.slice(
      0,
      1
    )}/${hash.slice(0, 2)}`;
    const futureEventJsonFilePath = `${futureEventBaseDir}/${hash}.json`;

    // check already fetched
    try {
      const alreadyFetched = (await fs.lstat(futureEventJsonFilePath)).isFile();
      if (alreadyFetched) {
        console.log("already fetched news:", newsItem.link);
        const futureEventJsonFile = await fs.readFile(
          futureEventJsonFilePath,
          "utf-8"
        );
        const futureEventJson = JSON.parse(futureEventJsonFile);
        return futureEventJson;
      }
    } catch (error) {
      console.log("fetch news:", newsItem.link);
    }

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
    const text = `${newsItem.pubDate.split("T")[0]} 配信\n${newsItem.title}\n${
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
      url: newsItem.link,
      title: newsItem.title,
      description: newsItem.description,
      pubDate: new Date(newsItem.pubDate),
      currentDate: new Date(currentDate),
      futureNearDate: new Date(futureNearDate),
      futureFarDate: new Date(futureFarDate),
      futureIndicateExpression,
      whatHappens,
    };

    //console.log("");
    //console.log("futureEvent:", futureEvent);
    console.log("----- ----- ----- ----- -----");

    await fs.mkdir(futureEventBaseDir, {
      recursive: true,
    });
    await fs.writeFile(
      futureEventJsonFilePath,
      JSON.stringify(futureEvent, null, 2)
    );

    return futureEvent;
  } catch (error) {
    console.error(error);
    console.error("Error!!!", newsItem.link);
  }
};

const futureEvents = await Promise.all(
  uniqueNewsItems.map((newsItem) => predictFuture(newsItem))
);

console.log(futureEvents.length);
