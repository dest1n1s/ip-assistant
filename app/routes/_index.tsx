import type { MetaFunction } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FilterCategory, FilterCategorySchema } from "~/lib/types/filter";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { retrieveChildFilters, search } from "~/lib/database/case.server";
import { FilterCard } from "~/components/app/filter-card";
import { mapWithDivider } from "~/lib/utils";
import { CaseCard } from "~/components/app/case-card";
import { CaseSchema } from "~/lib/types/case";

export const meta: MetaFunction = () => {
  return [
    { title: "知识产权助手" },
    {
      name: "description",
      content:
        "使用争议焦点、法律问题、案情描述等内容检索相关案例、法规、观点。",
    },
  ];
};

export async function loader() {
  const cases = await search();
  const filter = {
    name: "cause",
    displayName: "案由",
    filters: (await retrieveChildFilters("cause", [])).map((f) => ({
      ...f,
      selected: false,
    })),
  };
  return { cases, filter };
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const cases = CaseSchema.array().parse(loaderData.cases);
  const loaderFilter = FilterCategorySchema.parse(loaderData.filter);

  const form = useRef<HTMLFormElement>(null);
  const submit = useSubmit();
  const [filter, setFilter] = useState<FilterCategory>(loaderFilter);

  useEffect(() => {
    setFilter(loaderFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaderData.filter]);

  return (
    <div className="font-sans p-16 container flex flex-col gap-8">
      <Form ref={form}>
        <Input
          className="px-6 rounded-full border-2 border-primary"
          inputClassName="py-3 text-lg"
          placeholder="输入争议焦点、法律问题、案情描述..."
          name="q"
          tabIndex={-1}
          endContent={
            <Button variant="ghost" size="icon" type="submit">
              <Search />
            </Button>
          }
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              submit(form.current!);
            }
          }}
        />
      </Form>
      <div className="flex gap-8">
        <div className="flex basis-80 flex-col gap-4 shrink-0">
          <FilterCard filter={filter} onFilterChanged={setFilter} />
          {/* <FilterCard filter={filter} onFilterChanged={setFilter} /> */}
        </div>
        <div className="flex grow flex-col">
          {mapWithDivider(
            cases,
            (c, i) => (
              <CaseCard key={c.id} serialNumber={i + 1} case={c} />
            ),
            (_, i) => (
              <div
                key={`divider-${i}`}
                className="border-b border-border"
              ></div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
