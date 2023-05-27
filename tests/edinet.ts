import { OpenAI } from "langchain/llms/openai";

const ediNetListApiUrl =
  "https://disclosure.edinet-fsa.go.jp/api/v1/documents.json?date=2023-05-10&type=2";
const ediNetListApiRes = await fetch(ediNetListApiUrl);
const ediNetListApiResJson = await ediNetListApiRes.json();
const ediNetList = ediNetListApiResJson.results;

for (const item of ediNetList) {
  const docId = item.docID;
  console.log(docId);
  const ediNetDocApiRes = await fetch(`https://disclosure.edinet-fsa.go.jp/api/v1/documents/${docId}`);
  
}
