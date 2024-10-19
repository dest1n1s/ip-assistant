import { defer, LoaderFunctionArgs } from "@remix-run/node";
import { Await, Link, useLoaderData } from "@remix-run/react";
import { useChat } from "ai/react";
import { format } from "date-fns";
import { Suspense, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { Spinner } from "~/components/ui/spinner";
import { getCase, search } from "~/lib/database/case.server";
import { Case, CaseSchema } from "~/lib/types/case";
import { isTruthy } from "~/lib/types/guards";
import { mapWithDivider } from "~/lib/utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const name = params.name;
  if (!name) {
    return new Response("Bad Request", { status: 400 });
  }

  const caseData = await getCase(name);
  if (!caseData) {
    return new Response("Case Not Found", { status: 404 });
  }
  const relatedCases = caseData.content.basicCase
    ? search(caseData.content.basicCase, [], 1, 4, 0).then(cases =>
        cases.filter(c => c.name !== caseData.name),
      )
    : [];
  return defer({ case: caseData, relatedCases });
}

const contentType = {
  basicCase: "基本案情",
  judgeReason: "判决理由",
  judgmentSummary: "判决结果",
};

function useEffectOnce(fn: () => () => void) {
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current || process.env.NODE_ENV !== "development") {
      return fn();
    }
    return () => {
      ref.current = true;
    };
  }, []);
}

const Summary = ({ caseData }: { caseData: any }) => {
  const { messages, handleSubmit, isLoading, stop } = useChat({
    api: `/case/${caseData.name}/summary`,
  });
  useEffectOnce(() => {
    handleSubmit({}, { allowEmptySubmit: true });
    return stop;
  });
  return (
    <div className="flex flex-col gap-4 bg-surface shadow p-8">
      <h2 className="text-2xl font-bold text-foreground">AI 摘要</h2>
      {messages.length > 0 && (
        <Markdown className="prose">{messages[messages.length - 1].content}</Markdown>
      )}
      <Spinner show={isLoading} size="large" className="w-12 h-12" />
    </div>
  );
};

export default function CasePage() {
  const loaderData: { case: Case; relatedCases: never[] | Promise<Case[]> } =
    useLoaderData<typeof loader>();
  const c = CaseSchema.parse(loaderData.case);
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
        <div className="flex flex-col gap-4 basis-80 max-w-80 shrink-0">
          <Summary caseData={c} />

          <div className="flex flex-col gap-4 bg-surface shadow p-8">
            <h2 className="text-2xl font-bold text-foreground">相关案例</h2>
            <Suspense fallback={<Spinner size="large" className="w-12 h-12" />}>
              <Await resolve={loaderData.relatedCases}>
                {relatedCases =>
                  relatedCases.length > 0 ? (
                    mapWithDivider(
                      relatedCases,
                      (c: Case) => (
                        <Link key={c.name} to={`/case/${c.name}`} className="hover:underline">
                          {c.title}
                        </Link>
                      ),
                      (_, i) => <div key={`divider-${i}`} className="border-b border-border"></div>,
                    )
                  ) : (
                    <div>暂无相关案例</div>
                  )
                }
              </Await>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
