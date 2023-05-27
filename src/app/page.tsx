"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { TextInput } from "@/components/TextInput";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const onSubmit = useCallback(async () => {
    console.log(inputText);
  }, [inputText]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    }
  }, [mounted]);
  if (!mounted) return null;

  return (
    <main className={styles.main}>
      <div></div>
      <div>
        <Image
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div>
      <div style={{ position: "relative", width: "100%" }}>
        <TextInput
          inputText={inputText}
          setInputText={setInputText}
          onSubmit={onSubmit}
        />
      </div>
    </main>
  );
}
