import { ActionFunctionArgs } from "@remix-run/node";

import { getCase } from "~/lib/database/case.server";
import { openai } from "~/lib/openai.server";

import { streamText } from "ai";

const SYSTEM_PROMPT = `
你是一名专门负责总结复杂法律案件的中文法律助理。你的主要任务是从详细的法律文件中提取并总结关键信息，包括核心问题、审判程序、法院判决及相关的法律原则，并以简明清晰的方式呈现。

指令：

1. **目标**：给定详细的案件描述，生成一个连贯且准确的摘要，包括：
   - 案件背景
   - 主要法律争议及案由
   - 法院的判决依据和理由
   - 案件结果及其重要的法律意义

2. **语气与清晰度**：摘要应保持中立、专业，适合法律专业人士阅读。除非是案件的关键点，避免使用过多的法律术语。确保句子简洁明了。

3. **重点**：
   - 明确核心法律争议（如知识产权、合同违约等）。
   - 提取案件中适用的法律原则或法规。
   - 总结法院在证据和判决理由方面的考量。
   - 强调最终判决及其意义（如推翻先前判决、确立新的法律先例）。

4. **语言**：使用**简体中文**撰写，确保在保持法律准确性的同时，文字清晰简洁。遵循中文法律写作的正式规范。

5. **格式**：
   - 提供简短的**案件简介**。
   - 如果有必要，可使用段落或项目符号来提高可读性。
   - 突出判决中的关键点，包括引用的具体法律条款或法律依据。
`;

const generateUserPrompt = (caseData: any) => {
  return `
请根据以下案情描述，撰写一个简明扼要的法律案件摘要：

\`\`\`json
${JSON.stringify(caseData, null, 2)}
\`\`\`

请提炼案件的核心内容，并简要总结法院的判决依据与结果。不得超过 100 字。`;
};

export async function action({ request, params }: ActionFunctionArgs) {
  const name = params.name;
  if (!name) {
    return new Response("Bad Request", { status: 400 });
  }

  const caseData = await getCase(name);
  if (!caseData) {
    return new Response("Case Not Found", { status: 404 });
  }
  const result = await streamText({
    model: openai("gpt-4o"),
    maxRetries: 3,
    system: SYSTEM_PROMPT,
    prompt: generateUserPrompt(caseData),
  });

  return result.toDataStreamResponse();
}
