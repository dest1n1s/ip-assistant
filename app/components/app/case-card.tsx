import { format } from "date-fns";
import { memo } from "react";
import { Case } from "~/lib/types/case";
import { isTruthy } from "~/lib/types/guards";
import { mapWithDivider } from "~/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { Link } from "@remix-run/react";
import { Skeleton } from "components/ui/skeleton";
import katex from "katex";

export const ContentBlock = memo(({ content }: { content: string }) => {
  const paragraphs = content.split("\n").map(paragraph => <p key={paragraph}>{paragraph}</p>);
  return (
    <div className="p-8 bg-secondary max-h-60 overflow-y-scroll scrollbar">
      <div className="text-md prose lg:prose-lg max-w-[100ch]">{paragraphs}</div>
    </div>
  );
});
ContentBlock.displayName = "ContentBlock";

const contentType = {
  basicCase: "基本案情",
  judgeReason: "判决理由",
  judgmentSummary: "判决结果",
};

export interface CaseCardProps {
  serialNumber: number;
  case: Case;
}

export const CaseCard = memo(({ serialNumber, case: c }: CaseCardProps) => {
  const additionalInfos = [
    c.cause.length > 0 && c.cause[c.cause.length - 1],
    c.court,
    c.name,
    format(c.judgedAt, "yyyy-MM-dd"),
  ].filter(isTruthy);

  const contents = Object.entries(contentType).flatMap(([key, value]) => {
    if (c.content[key]) {
      return [
        {
          key,
          name: value,
          content: c.content[key],
        },
      ];
    }
    return [];
  });

  const textScore = (c.textScore || 0) * (c.textScore || 0);
  const vectorScore = (c.vectorScore || 0) * (c.vectorScore || 0) * 100;

  const latex = String.raw`${c.sortScore?.toFixed(2)} = \underbrace{${textScore.toFixed(2)}}_{\text{Full-Text Score}} + \underbrace{${vectorScore.toFixed(2)}}_{\text{Vector Score}}`;

  return (
    <div className="p-4 flex flex-col gap-4 items-start text-foreground bg-surface">
      <div className="flex gap-2 items-start">
        <div className="bg-primary text-primary-lighten-1 h-7 w-7 flex justify-center items-center shrink-0">
          {serialNumber}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-start">
            {c.type && (
              <div className="bg-blue-500 text-primary-foreground py-1 px-2 shrink-0 text-sm">
                {c.type}
              </div>
            )}
            {c.sortScore && (
              <HoverCard>
                <HoverCardTrigger>
                  <div className="bg-yellow-500 text-primary-foreground py-1 px-2 shrink-0 text-sm">
                    {c.sortScore.toFixed(2)}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-min py-0">
                  <div
                    className="w-min"
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(latex, {
                        displayMode: true,
                      }),
                    }}
                  />
                </HoverCardContent>
              </HoverCard>
            )}
            <Link to={`/case/${c.name}`} className="grow">
              <div className="text-lg font-semibold hover:underline">{c.title}</div>
            </Link>
          </div>

          <div className="text-md text-foreground-weaken-1 flex gap-1.5 flex-wrap">
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
        </div>
      </div>
      {contents.length > 0 && (
        <Tabs defaultValue={contents[0].key} className="w-full">
          <TabsList className="flex w-full">
            {contents.map(({ key, name }) => (
              <TabsTrigger key={key} value={key} className="grow">
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
          {contents.map(({ key, content }) => (
            <TabsContent key={key} value={key}>
              <ContentBlock content={content} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
});
CaseCard.displayName = "CaseCard";

export const CaseCardSkeleton = memo(() => {
  return (
    <div className="p-4 flex flex-col gap-4 items-start text-foreground bg-surface">
      <div className="flex gap-2 items-start w-full">
        <Skeleton className="bg-primary text-primary-lighten-1 h-7 w-7 flex justify-center items-center shrink-0" />
        <div className="flex flex-col gap-2 grow">
          <div className="flex gap-2   items-start">
            <Skeleton className="h-7 grow" />
          </div>

          <div className="text-md text-foreground-weaken-1 flex gap-1.5">
            <Skeleton className="grow h-4" />
            <Skeleton className="grow h-4" />
            <Skeleton className="grow h-4" />
          </div>
        </div>
      </div>
      <div className="w-full">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full mt-2" />
      </div>
    </div>
  );
});
CaseCardSkeleton.displayName = "CaseCardSkeleton";
