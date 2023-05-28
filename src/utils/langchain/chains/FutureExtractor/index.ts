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
FutureIndicateExpression: Expressions indicating the future in the text.
FutureNearDate: Nearest future date estimated from CurrentDate and FutureIndicateExpression.
FutureFarDate: Farthest future date estimated from CurrentDate and FutureIndicateExpression.
WhatHappens: Concise summary of what event is appointments in future, SHOULD be includes who, what and where, MUST NOT be includes FutureIndicateExpression, MUST be same language as input text.
... (You MUST ALWAYS output only one CurrentDate. If it is unclear, output as Unknown)
... (You MUST ALWAYS output at least one WhatHappens. If it is unclear, output as Unknown)
... (this FutureIndicateExpression/FutureNearDate/FutureFarDate/WhatHappens can repeat N times)

Examples:
-----
Input text:
2023-05-19 配信
防衛費増額の財源確保に向けて「防衛力強化資金」の創設を盛り込んだ法案は、19日の衆議院財務金融委員会で採決が行われ、自民・公明両党などの賛成多数で可決されました。法案は、来週、本会議でも可決されて参議院に送られる見通しです。
Output:
CurrentDate: 2023-05-19
FutureIndicateExpression: 来週
FutureNearDate: 2023-05-22
FutureFarDate: 2023-05-28
WhatHappens: 本会議で、 防衛力強化資金の創設を盛り込んだ法案が可決され、参議院に送られる

Input text:
2023-05-26 配信
政府が来月「骨太の方針」をまとめるのを前に、自民党内のいわゆる財政再建派の議員らは、財政の持続可能性を維持するため必要があれば将来的な増税の議論も排除しない内容の提言案を大筋で了承しました。
Output:
CurrentDate: 2023-05-26
FutureIndicateExpression: 来月
FutureNearDate: 2023-06-01
FutureFarDate: 2023-06-30
WhatHappens: 政府が、「骨太の方針」をまとめる

Input text:
2023-05-26 配信
浜田防衛大臣は、アメリカのオースティン国防長官と来月1日に東京都内で会談することを明らかにしました。日米同盟の抑止力、対処力の強化に向けた具体的な取り組みについて協議することにしています。
Output:
CurrentDate: 2023-05-26
FutureIndicateExpression: 来月1日
FutureNearDate: 2023-06-01
FutureFarDate: 2023-06-01
WhatHappens: 浜田防衛大臣が、東京都内で、アメリカのオースティン国防長官と会談する

Input text:
2023-05-26 配信
世界初の民間による月面着陸を目指し、地球からおよそ38万キロ離れた月に着陸船を送ったものの、先月、着陸に失敗した日本のベンチャー企業が会見を開き、着陸船が月面にある崖の上を通過したあと高度の認識にずれが生じ、燃料が尽きて5キロほどの高さから落下したと明らかにしました。この企業では、対策を講じたうえで来年、再び着陸に挑む予定です。
Output:
CurrentDate: 2023-05-26
FutureIndicateExpression: 来年
FutureNearDate: 2024-01-01
FutureFarDate: 2024-12-31
WhatHappens: 世界初の民間による月面着陸に失敗した日本のベンチャー企業が、再び月面着陸に挑む

Input text:
2023-05-27 配信
アメリカのイエレン財務長官は、議会が債務上限の引き上げなどに応じなければ、来月5日に債務の不履行に陥るおそれがあるという最新の見通しを示しました。これまでは、早ければ来月1日が期限だとしてきており、日程上、わずかな余裕が生まれた形です。
Output:
CurrentDate: 2023-05-27
FutureIndicateExpression: 来月1日
FutureIndicateExpression: 来月5日
FutureNearDate: 2023-06-01
FutureFarDate: 2023-06-05
WhatHappens: アメリカの議会が、債務上限の引き上げなどに応じなければ、債務の不履行に陥るおそれがある

Input text:
2023-05-12 配信
4年前、「京都アニメーション」のスタジオが放火され、社員36人が死亡した事件で、殺人などの罪で起訴された青葉真司被告の裁判員裁判の初公判が、ことし9月5日に開かれ、判決が来年1月25日に言い渡されることになりました。
Output:
CurrentDate: 2023-05-12
FutureIndicateExpression: ことし9月5日
FutureNearDate: 2023-09-05
FutureFarDate: 2023-09-05
WhatHappens: 青葉真司被告の裁判員裁判の初公判が開かれる
FutureIndicateExpression: 来年1月25日
FutureNearDate: 2024-01-25
FutureFarDate: 2024-01-25
WhatHappens: 青葉真司被告の裁判員裁判の判決が言い渡される

Input text:
2023-05-12 配信
アメリカ本土の上空を飛行した中国の気球の問題などをめぐり、アメリカと中国の対立が深まる中、両国の高官が会談し、対話を継続していくことで一致しました。バイデン政権の高官は会談後、閣僚などの訪問が数か月以内に実現するという見通しを示しました。
Output:
CurrentDate: 2023-05-12
FutureIndicateExpression: 数か月以内
FutureNearDate: 2023-06-01
FutureFarDate: 2024-02-28
WhatHappens: アメリカと中国の閣僚などの訪問が実現する

Input text:
2023-05-19 配信
iPS細胞から作った心臓の細胞の移植について、大阪大学の研究グループは新たな治療法を開発するための治験として計画していた手術をすべて終了したと発表しました。患者の経過はいずれも順調で、2年以内の実用化を目指したいとしています。
Output text: 
CurrentDate: 2023-05-19
FutureIndicateExpression: 2年以内
FutureNearDate: 2024-05-19
FutureFarDate: 2025-05-19
WhatHappens: 大阪大学が、iPS細胞から作った心臓の細胞の移植について、実用化を目指す

Input text:
2023-04-25 配信
茨城県つくば市にある筑波大学は、病院に行かなくても睡眠障害の検査が受けられる特殊なバスを開発し、数年以内の実用化を目標に実証実験を進めています。
Output text: 
CurrentDate: 2023-04-25
FutureIndicateExpression: 数年以内
FutureNearDate: 2024-04-25
FutureFarDate: 2032-04-25
WhatHappens: 筑波大学が、病院に行かなくても睡眠障害の検査が受けられる特殊なバスを開発し、実用化を目標に実証実験を進める
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
