import { LLMChain } from "langchain/chains";
import { BaseLanguageModel } from "langchain/dist/base_language";
import { PromptTemplate } from "langchain/prompts";

export const loadFutureExtractorChain = ({
  llm,
}: {
  llm: BaseLanguageModel;
}): LLMChain => {
  const futureExtractorPromptTemplateString = `You are a text mining system that extracts any entity of current dates and future appointments mentioned in a input text.

Entity Definition and Output Format:
CurrentDate: Current date mentioned in the text.
FutureDate: Estimated most future dates from the text.
WhatHappens: Concise summary of what event is appointments in future, MUST be same language as input text
... (You MUST ALWAYS output only one CurrentDate. If it is unclear, output as Unknown)
... (this FutureDate/WhatHappens can repeat N times)

Examples:
-----
Input text:
News Delivery Time: 2023-05-27
Cab fares in Ishikawa Prefecture will be raised for the first time in 15 years starting next month on the 26th.
Output:
CurrentDate: 2023-05-27
FutureDate: 2023-06-26
WhatHappens: Cab fares in Ishikawa Prefecture will be raised for the first time in 15 years.

Input text:
News Delivery Time: 2023-05-27
政府は児童手当の第3子以降への多子加算の対象を、現行の「3歳～小学生」から「0歳～高校生」に拡大する最終調整に入った。月3万円の支給を検討している。政府関係者が明らかにした。来週にも開かれる政府の「こども未来戦略会議」で示す、「こども未来戦略方針」の素案に盛り込む見通し。
Output:
CurrentDate: 2023-05-27
FutureDate: 2023-06-03
WhatHappens: 「こども未来戦略方針」の素案に、児童手当の第3子以降への多子加算の対象拡大を盛り込む
-----

Input text:
{text}

Output:`;

  const futureExtractorPromptTemplate = PromptTemplate.fromTemplate(
    futureExtractorPromptTemplateString
  );
  const chain = new LLMChain({
    llm: llm,
    prompt: futureExtractorPromptTemplate,
  });
  return chain;
};
