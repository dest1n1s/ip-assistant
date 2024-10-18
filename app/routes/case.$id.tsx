import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useChat } from "ai/react";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { getCase } from "~/lib/database/case.server";
import { CaseSchema } from "~/lib/types/case";
import { isTruthy } from "~/lib/types/guards";
import { mapWithDivider } from "~/lib/utils";
export async function loader({ request, params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) {
    return new Response("Bad Request", { status: 400 });
  }

  const caseData = await getCase(id);
  if (!caseData) {
    return new Response("Case Not Found", { status: 404 });
  }

  return { case: caseData };
}

const contentType = {
  basicCase: "基本案情",
  judgeReason: "判决理由",
  judgmentSummary: "判决结果",
};

function useEffectOnce(fn: () => void) {
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) {
      fn();
    }
    return () => {
      ref.current = true;
    };
  }, []);
}

const Summary = ({ caseData }: { caseData: any }) => {
  const { messages, handleSubmit } = useChat({
    api: `/case/${caseData.id}/summary`,
  });
  useEffectOnce(() => {
    handleSubmit({}, { allowEmptySubmit: true });
  });
  return (
    <>
      <h2 className="text-2xl font-bold text-foreground">AI 摘要</h2>
      {messages.length > 0 && (
        <Markdown className="prose">{messages[messages.length - 1].content}</Markdown>
      )}
    </>
  );
};

export default function CasePage() {
  const loaderData = useLoaderData<typeof loader>();
  const c = CaseSchema.parse(loaderData.case);

  const [messages, setMessages] = useState<string[]>([]);
  // const lastMessage = useEventSource(`/case/${c.id}/summary`);
  // useEffect(
  //   function saveMessage() {
  //     console.log(lastMessage);
  //     setMessages(current => {
  //       if (typeof lastMessage === "string") return current.concat(lastMessage);
  //       return current;
  //     });
  //   },
  //   [lastMessage],
  // );

  const additionalInfos = [
    c.cause.length > 0 && c.cause[c.cause.length - 1],
    c.court,
    c.name,
    format(c.judgedAt, "yyyy-MM-dd"),
  ].filter(isTruthy);

  const contents = [
    ...Object.entries(contentType).flatMap(
      ([key, value]) =>
        c.content[key] && {
          key,
          name: value,
          content: c.content[key].split("\n").filter(isTruthy).join("\n\n"),
        },
    ),
    c.relationalIndex && {
      key: "relationalIndex",
      name: "关联索引",
      content: c.relationalIndex.split("\n").filter(isTruthy).join("\n\n"),
    },
  ].filter(isTruthy);

  return (
    <div className="font-sans p-16 container flex flex-col gap-8">
      <div className="flex gap-8">
        <div className="flex flex-col bg-surface shadow p-8 gap-4">
          <h1 className="text-3xl font-bold text-foreground">{c.title}</h1>
          <div className="text-md text-foreground-weaken-1 flex gap-3">
            {mapWithDivider(
              additionalInfos,
              cur => (
                <div key={cur}>{cur}</div>
              ),
              (_, i) => (
                <div key={`divider-${i}`} className="border-r border-border"></div>
              ),
            )}
          </div>
          <div className="flex flex-col select-none max-h-80 border border-input">
            <div className="p-4 font-bold bg-blue-200">案由</div>
            <div className="border-b border-input" />
            <div className="p-4 flex gap-1">
              {mapWithDivider(
                c.cause,
                cur => (
                  <Link
                    to={`/?qFilters=cause:${cur}`}
                    className="text-primary hover:underline"
                    key={cur}
                  >
                    {cur}
                  </Link>
                ),
                (_, i) => (
                  <div key={`divider-${i}`}>{">"}</div>
                ),
              )}
            </div>
          </div>

          {contents.map(({ key, name, content }) => (
            <div key={key} className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-foreground">{name}</h2>
              <Markdown className="prose max-w-full indent-[33px]">{content}</Markdown>
            </div>
          ))}
        </div>
        <div className="flex basis-80 max-w-80 flex-col shrink-0 bg-surface shadow p-8 gap-4 h-min">
          <Summary caseData={c} />
        </div>
      </div>
    </div>
  );
}
