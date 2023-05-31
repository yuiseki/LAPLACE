"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { TextInput } from "@/components/TextInput";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { jsonFetcher } from "@/utils/jsonFetcher";

const formatDate = (date: Date) => {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

export default function Home() {
  const { data, error } = useSWR<
    Array<{
      link: string;
      description: string;
      title: string;
      pubDate: string;
      currentDate: string;
      futureFarDate: string;
      futureIndicateExpression: string;
      futureNearDate: string;
      whatHappens: string;
    }>
  >("/data/www3.nhk.or.jp/future_events/latest_events.json", jsonFetcher);

  const [inputText, setInputText] = useState("");
  const onSubmit = useCallback(async () => {
    console.log(inputText);
  }, [inputText]);

  const [sortedFutureEvents, setSortedFutureEvents] = useState<
    | Array<{
        link: string;
        description: string;
        title: string;
        pubDate: string;
        currentDate: string;
        futureFarDate: string;
        futureIndicateExpression: string;
        futureNearDate: string;
        whatHappens: string;
      }>
    | undefined
  >(undefined);

  useEffect(() => {
    if (!data) {
      return;
    }

    const newSortedFutureEvents = data
      .filter((v) => v)
      .filter(
        (element) =>
          new Date().getTime() < new Date(element.futureFarDate).getTime()
      )
      .filter((element, index: number, self) => {
        return (
          self.findIndex((e) => e.whatHappens === element.whatHappens) === index
        );
      })
      .filter((element, index: number, self) => {
        return self.findIndex((e) => e.title === element.title) === index;
      })
      .filter((futureEvent) => {
        if (
          futureEvent.futureNearDate === null ||
          futureEvent.futureFarDate === null ||
          futureEvent.futureNearDate === "Unknown" ||
          futureEvent.futureFarDate === "Unknown"
        ) {
          return false;
        }
        if (
          futureEvent.whatHappens.includes("選手") ||
          futureEvent.whatHappens.includes("試合") ||
          futureEvent.whatHappens.includes("優勝") ||
          futureEvent.whatHappens.includes("アジアカップ")
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.futureFarDate !== b.futureFarDate) {
          return (
            new Date(a.futureFarDate).getTime() -
            new Date(b.futureFarDate).getTime()
          );
        } else {
          return (
            new Date(a.futureNearDate).getTime() -
            new Date(b.futureNearDate).getTime()
          );
        }
      });
    setSortedFutureEvents(newSortedFutureEvents);
  }, [data]);

  const getFutureEvents = useCallback(
    (start: Date, end: Date) => {
      if (!sortedFutureEvents) {
        return;
      }
      const filteredFutureEvents = sortedFutureEvents
        .filter((event) => {
          return (
            start.getTime() <= new Date(event.futureNearDate).getTime() &&
            new Date(event.futureNearDate).getTime() <= end.getTime()
          );
        })
        .filter((event) => {
          if (inputText.length === 0) {
            return true;
          } else {
            return event.whatHappens.includes(inputText);
          }
        });
      return filteredFutureEvents;
    },
    [inputText, sortedFutureEvents]
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    }
  }, [mounted]);
  if (!mounted) return null;
  return (
    <main
      style={{
        padding: "10px",
        maxWidth: "1000px",
        margin: "0 auto 240px",
      }}
    >
      <h1>Predictions by LAPLACE</h1>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {Array.from({ length: 49 }, (_, i) => i + 1).map((idx) => {
          const now = new Date();
          const thisMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() + idx - 1,
            1
          );
          const thisMonthEnd = new Date(
            now.getFullYear(),
            now.getMonth() + idx,
            0
          );
          const thisMonthFutureEvents = getFutureEvents(
            thisMonthStart,
            thisMonthEnd
          );
          if (!thisMonthFutureEvents) return null;
          if (thisMonthFutureEvents.length === 0) return null;
          return (
            <div key={idx} style={{ margin: "40px 0" }}>
              <h2 style={{ width: "100%" }}>
                {thisMonthStart.getFullYear()}年{thisMonthStart.getMonth() + 1}
                月
              </h2>
              <div>
                {thisMonthFutureEvents &&
                  thisMonthFutureEvents.map((event) => {
                    const futureNearDate = new Date(event.futureNearDate);
                    const futureFarDate = new Date(event.futureFarDate);
                    const whatHappens = event.whatHappens;
                    const whenHappens =
                      futureNearDate.getTime() === futureFarDate.getTime()
                        ? `${formatDate(futureNearDate)}に、`
                        : `${formatDate(futureNearDate)}から${formatDate(
                            futureFarDate
                          )}の間に、`;
                    return (
                      <div
                        key={event.title}
                        style={{
                          margin: "40px 0",
                        }}
                      >
                        <h3>{whenHappens}</h3>
                        <p>{whatHappens}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "fixed", bottom: 20, left: 0, width: "100%" }}>
        <TextInput
          inputText={inputText}
          setInputText={setInputText}
          onSubmit={onSubmit}
        />
      </div>
    </main>
  );
}
