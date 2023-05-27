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
FutureNearDate: Most near future date estimated from the text.
FutureFarDate: Most far future date estimated from the text.
FutureIndicateExpression: Expressions indicating the future in the text.
WhatHappens: Concise summary of what event is appointments in future, SHOULD be includes who, what and where, MUST NOT be includes FutureIndicateExpression, MUST be same language as input text.
... (You MUST ALWAYS output only one CurrentDate. If it is unclear, output as Unknown)
... (You MUST ALWAYS output at least one WhatHappens. If it is unclear, output as Unknown)
... (this FutureNearDate/FutureFarDate/FutureIndicateExpression/WhatHappens can repeat N times)

Examples:
-----
Input text:
2023-05-19 配信
防衛費増額 財源確保の法案 賛成多数で可決 衆院 財務金融委
防衛費増額の財源確保に向けて「防衛力強化資金」の創設を盛り込んだ法案は、19日の衆議院財務金融委員会で採決が行われ、自民・公明両党などの賛成多数で可決されました。法案は、来週、本会議でも可決されて参議院に送られる見通しです。
Output:
CurrentDate: 2023-05-19
FutureNearDate: 2023-05-22
FutureFarDate: 2023-05-28
FutureIndicateExpression: 来週
WhatHappens: 本会議で、 防衛力強化資金の創設を盛り込んだ法案が可決され、参議院に送られる

Input text:
2023-05-26 配信
自民 財政再建派議員ら“将来的な増税議論も”提言案 大筋了承
政府が来月「骨太の方針」をまとめるのを前に、自民党内のいわゆる財政再建派の議員らは、財政の持続可能性を維持するため必要があれば将来的な増税の議論も排除しない内容の提言案を大筋で了承しました。
Output:
CurrentDate: 2023-05-26
FutureNearDate: 2023-06-01
FutureFarDate: 2023-06-30
FutureIndicateExpression: 来月
WhatHappens: 政府が、「骨太の方針」をまとめる

Input text:
2023-05-26 配信
浜田防衛相 米オースティン国防長官と都内で会談へ
浜田防衛大臣は、アメリカのオースティン国防長官と来月1日に東京都内で会談することを明らかにしました。日米同盟の抑止力、対処力の強化に向けた具体的な取り組みについて協議することにしています。
Output:
CurrentDate: 2023-05-26
FutureNearDate: 2023-06-01
FutureFarDate: 2023-06-01
FutureIndicateExpression: 来月1日
WhatHappens: 浜田防衛大臣が、東京都内で、アメリカのオースティン国防長官と会談する

Input text:
2023-05-26 配信
月面着陸失敗 ベンチャー企業「高度の認識ずれ 燃料尽き落下」
世界初の民間による月面着陸を目指し、地球からおよそ38万キロ離れた月に着陸船を送ったものの、先月、着陸に失敗した日本のベンチャー企業が会見を開き、着陸船が月面にある崖の上を通過したあと高度の認識にずれが生じ、燃料が尽きて5キロほどの高さから落下したと明らかにしました。この企業では、対策を講じたうえで来年、再び着陸に挑む予定です。
Output:
CurrentDate: 2023-05-26
FutureNearDate: 2024-01-01
FutureFarDate: 2024-12-31
FutureIndicateExpression: 来年
WhatHappens: 世界初の民間による月面着陸に失敗した日本のベンチャー企業が、再び月面着陸に挑む

Input text:
2023-05-27 配信
米債務上限問題 “来月5日に債務不履行陥るおそれ” 財務長官
アメリカのイエレン財務長官は、議会が債務上限の引き上げなどに応じなければ、来月5日に債務の不履行に陥るおそれがあるという最新の見通しを示しました。これまでは、早ければ来月1日が期限だとしてきており、日程上、わずかな余裕が生まれた形です。
Output:
CurrentDate: 2023-05-27
FutureNearDate: 2023-06-01
FutureFarDate: 2023-06-05
FutureIndicateExpression: 来月1日
FutureIndicateExpression: 来月5日
WhatHappens: アメリカの議会が、債務上限の引き上げなどに応じなければ、債務の不履行に陥るおそれがある
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
