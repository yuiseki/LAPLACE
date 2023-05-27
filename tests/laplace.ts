import * as dotenv from "dotenv";
dotenv.config();

import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { loadSummarizationChain } from "langchain/chains";

const llm = new OpenAI({ temperature: 0 });
const directory = "public/data/www3.nhk.or.jp/vector_stores/";
const vectorStore = await HNSWLib.load(directory, new OpenAIEmbeddings());

const questions = [
  "来週の日本はどうなる？",
  "来月の日本はどうなる？",
  "来年の日本はどうなる？",
  "来週のアメリカはどうなる？",
  "来月のアメリカはどうなる？",
  "来年のアメリカはどうなる？",
];

for await (const input of questions) {
  console.log("Q:", input);
  const now = new Date();

  const results = await vectorStore.similaritySearch(
    input,
    10,
    (document) =>
      now.getTime() < new Date(document.metadata.futureFarDate).getTime()
  );
  const sortedSlicedResults = results
    .sort(
      (a, b) =>
        new Date(a.metadata.futureFarDate).getTime() -
        new Date(b.metadata.futureFarDate).getTime()
    )
    .slice(0, 3);

  const chain = loadSummarizationChain(llm, { type: "stuff" });
  const res = await chain.call({
    input_documents: sortedSlicedResults,
  });
  console.log("A:", res.text);
}
