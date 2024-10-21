import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { Link } from "@remix-run/react";
import { Skeleton } from "components/ui/skeleton";
import katex from "katex";
import { memo } from "react";
import { isTruthy } from "~/lib/types/guards";
import { Law } from "~/lib/types/law";

export interface LawCardProps {
  serialNumber: number;
  law: Law;
}

export const LawCard = ({ serialNumber, law }: LawCardProps) => {
  const textScore = (law.textScore || 0) * (law.textScore || 0);
  const vectorScore = (law.vectorScore || 0) * (law.vectorScore || 0) * 100;

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

  const latex = String.raw`${law.sortScore?.toFixed(2)} = \underbrace{${textScore.toFixed(2)}}_{\text{Full-Text Score}} + \underbrace{${vectorScore.toFixed(2)}}_{\text{Vector Score}}`;

  const intro = [law.introduction, law.notification].filter(isTruthy).join(" ");

  return (
    <div className="p-4 flex flex-col gap-4 items-start text-foreground bg-surface">
      <div className="flex gap-2 items-start">
        <div className="bg-primary text-primary-lighten-1 h-7 w-7 flex justify-center items-center shrink-0">
          {serialNumber}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-start">
            {law.sortScore && (
              <HoverCard>
                <HoverCardTrigger>
                  <div className="bg-yellow-500 text-primary-foreground py-1 px-2 shrink-0 text-sm">
                    {law.sortScore.toFixed(2)}
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
            <Link to={`/law/${law.title}`} className="grow">
              <div className="text-lg font-semibold hover:underline">{law.title}</div>
            </Link>
          </div>
          {intro && (
            <div className="text-md line-clamp-3 text-gray-700">{intro}...</div>
          )}
          {matchedContents && (
            <div className="text-md flex flex-col gap-4 py-2  ">
              <div className="font-bold">匹配内容：</div>
              {matchedContents.map(({ path, content }) => (
                <div key={path.map(p => p.index).join(":")} className="line-clamp-2 px-4">
                  <span className="font-bold shrink-0">
                    {path.map(p => (p.name ? `${p.index} ${p.name}` : p.index)).join(" > ")}
                  </span>{" "}
                  <span>{content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
LawCard.displayName = "LawCard";

export const LawCardSkeleton = memo(() => {
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
LawCardSkeleton.displayName = "LawCardSkeleton";
