import { format } from "date-fns";
import { memo } from "react";
import { Case } from "~/lib/types/case";
import { isTruthy } from "~/lib/types/guards";
import { mapWithDivider } from "~/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export const ContentBlock = memo(({ content }: { content: string }) => {
  const paragraphs = content
    .split("\n")
    .map((paragraph) => <p key={paragraph}>{paragraph}</p>);
  return (
    <div className="p-8 bg-secondary max-h-60 overflow-y-scroll scrollbar">
      <div className="text-md prose lg:prose-lg max-w-[100ch]">
        {paragraphs}
      </div>
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
            <div className="text-lg font-semibold">{c.title}</div>
          </div>

          <div className="text-md text-foreground-weaken-1 flex gap-1.5">
            {mapWithDivider(
              additionalInfos,
              (cur) => (
                <div key={cur}>{cur}</div>
              ),
              (_, i) => (
                <div
                  key={`divider-${i}`}
                  className="border-r border-border"
                ></div>
              )
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
