import { ActionFunctionArgs } from "@remix-run/node";
import { convertToCoreMessages, streamText } from "ai";
import { search, searchForLaws } from "~/lib/database/case.server";
import { logger } from "~/lib/logging.server";
import { openai } from "~/lib/openai.server";

const PROMPT_START = `
请你根据提供的案例与法律，对一个问题围绕争议焦点进行回答或概述。案例与法律如下：

`;

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || undefined;
  const qFilters = url.searchParams
    .getAll("qFilters")
    .map(f => f.split(":"))
    .map(([category, name]) => ({ category, name }));
  const { messages } = await request.json();

  const [cases, laws] = await Promise.all([
    search({ query: q, filters: qFilters, pageSize: 10, page: 1 }),
    searchForLaws({ query: q, pageSize: 10, page: 1 }),
  ]);

  const lawMapped = laws.map(law => {
    const matchedContents = law.path?.map(path => ({
      path,
      content: path.reduce<any>(
        (acc, cur, i) =>
          acc.find((item: any) => item.index === cur.index)?.[
            i === path.length - 1 ? "content" : "children"
          ],
        law.content,
      ) as string,
    }));
    return {
      title: law.title,
      matchedContents,
    };
  });

  const prompt =
    PROMPT_START +
    cases
      .slice(3)
      .map(c => JSON.stringify({ title: c.title, subtitle: c.subtitle, content: c.content }))
      .map((c, i) => `案例 ${i + 1}：\n${c}`)
      .join("\n\n") +
    lawMapped
      .slice(3)
      .map(law => JSON.stringify(law))
      .map((c, i) => `法律 ${i + 1}：\n${c}`)
      .join("\n\n") +
    "\n\n" +
    "问题或主题：" +
    q +
    "\n\n在回答时不要出现“案例 1”、“法律 1”等字样，而是使用其标题或内容（如有必要）。尽量简洁地回答问题或进行概述。";

  logger.info("[chat] Prompt generated. Length: " + prompt.length);

  const realMessages = [
    {
      role: "user",
      content: prompt,
    },
    ...messages,
  ];

  const result = await streamText({
    model: openai("gpt-4o"),
    messages: convertToCoreMessages(realMessages),
  });

  return result.toDataStreamResponse({
    sendUsage: false,
  });
}
