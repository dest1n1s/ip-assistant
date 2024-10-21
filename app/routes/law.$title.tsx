import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { memo } from "react";
import { getLaw } from "~/lib/database/case.server";
import { Law, LawSchema } from "~/lib/types/law";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const title = params.title;
  if (!title) {
    return new Response("Bad Request", { status: 400 });
  }

  const law = await getLaw(title);
  if (!law) {
    return new Response("Law Not Found", { status: 404 });
  }
  return { law };
}

const getLevel = (content: any): number => {
  if (!content.children) {
    return 1;
  }
  return getLevel(content.children[0]) + 1;
};

const LawContent = memo(({ content }: { content: any }) => {
  const level = getLevel(content);
  if (level === 1) {
    return (
      <p className="indent-[33px] space-x-4">
        <span className="font-bold">{content.index}</span>
        <span>{content.content}</span>
      </p>
    );
  } else if (level === 2) {
    return (
      <>
        <h4 className="text-lg font-bold space-x-4">
          <span>{content.index}</span>
          <span>{content.name}</span>
        </h4>
        {content.children.map((child: any, idx: number) => (
          <LawContent key={idx} content={child} />
        ))}
      </>
    );
  } else if (level === 3) {
    return (
      <>
        <h3 className="text-xl font-bold space-x-4">
          <span>{content.index}</span>
          <span>{content.name}</span>
        </h3>
        {content.children.map((child: any, idx: number) => (
          <LawContent key={idx} content={child} />
        ))}
      </>
    );
  } else if (level === 4) {
    return (
      <>
        <h2 className="text-2xl font-bold space-x-4">
          <span>{content.index}</span>
          <span>{content.name}</span>
        </h2>
        {content.children.map((child: any, idx: number) => (
          <LawContent key={idx} content={child} />
        ))}
      </>
    );
  }
  return null;
});

export default function LawPage() {
  const loaderData: { law: Law } = useLoaderData<typeof loader>();
  const law = LawSchema.parse(loaderData.law);

  return (
    <div className="font-sans p-16 container flex flex-col gap-8">
      <div className="flex gap-8">
        <div className="flex flex-col gap-4 basis-40 max-w-40 shrink-0"></div>
        <div className="flex flex-col bg-surface shadow p-8 gap-12">
          <h1 className="text-3xl font-bold text-foreground self-center">{law.title}</h1>
          {law.notification && <p className="text-lg text-gray-700">{law.notification}</p>}
          {law.introduction && <p className="text-lg text-gray-700">{law.introduction}</p>}
          <div className="flex flex-col gap-8">
            {law.content.map((content, idx) => (
              <LawContent key={idx} content={content} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 basis-40 max-w-40 shrink-0"></div>
      </div>
    </div>
  );
}
