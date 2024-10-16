import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CaseCard } from "~/components/app/case-card";
import { FilterCard } from "~/components/app/filter-card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { retrieveChildFilters, search } from "~/lib/database/case.server";
import { CaseSchema } from "~/lib/types/case";
import { FilterCategory, FilterCategorySchema } from "~/lib/types/filter";
import { mapWithDivider } from "~/lib/utils";

export const meta: MetaFunction = () => {
  return [
    { title: "知识产权助手" },
    {
      name: "description",
      content: "使用争议焦点、法律问题、案情描述等内容检索相关案例、法规、观点。",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || undefined;
  const page = parseInt(url.searchParams.get("page") || "0");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
  const cases = await search(q, [], 1, pageSize, page);
  const filter = {
    name: "cause",
    displayName: "案由",
    filters: (await retrieveChildFilters("cause", [])).map(f => ({
      ...f,
      selected: false,
    })),
  };
  return { cases, filter, page, q };
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const cases = CaseSchema.array().parse(loaderData.cases);
  const loaderFilter = FilterCategorySchema.parse(loaderData.filter);
  const page = loaderData.page;

  const form = useRef<HTMLFormElement>(null);
  const submit = useSubmit();
  const [filter, setFilter] = useState<FilterCategory>(loaderFilter);

  const [q, setQ] = useState(loaderData.q);

  useEffect(() => {
    setFilter(loaderFilter);
  }, [loaderData.filter]);

  useEffect(() => {
    setQ(loaderData.q);
  }, [loaderData.q]);

  return (
    <div className="font-sans p-16 container flex flex-col gap-8">
      <Form ref={form} method="get">
        <Input
          className="px-6 rounded-full border-2 border-primary"
          inputClassName="py-3 text-lg"
          placeholder="输入争议焦点、法律问题、案情描述..."
          name="q"
          value={q}
          onChange={e => setQ(e.target.value)}
          tabIndex={-1}
          endContent={
            <Button variant="ghost" size="icon" type="submit">
              <Search />
            </Button>
          }
          onKeyUp={e => {
            if (e.key === "Enter") {
              submit(form.current!);
            }
          }}
        />
      </Form>
      <div className="flex gap-8">
        <div className="flex basis-80 flex-col gap-4 shrink-0">
          <FilterCard filter={filter} onFilterChanged={setFilter} />
        </div>
        <div className="flex grow flex-col">
          {mapWithDivider(
            cases,
            (c, i) => (
              <CaseCard key={c.id} serialNumber={i + 1} case={c} />
            ),
            (_, i) => (
              <div key={`divider-${i}`} className="border-b border-border"></div>
            ),
          )}
          <div className="border-b border-border"></div>
          <div className="p-2 flex gap-4 items-start text-foreground bg-surface">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious to="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    2
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}
