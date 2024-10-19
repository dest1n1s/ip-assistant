import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CaseCard } from "~/components/app/case-card";
import { FilterCard } from "~/components/app/filter-card";
import { FilterChip } from "~/components/app/filter-chip";
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
import {
  retrieveChildFilters,
  retrieveFilters,
  retrieveTimeFilters,
  search,
} from "~/lib/database/case.server";
import { CaseSchema } from "~/lib/types/case";
import { FilterCategory, FilterCategorySchema, NestedFilter } from "~/lib/types/filter";
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
  const qFilters = url.searchParams
    .getAll("qFilters")
    .map(f => f.split(":"))
    .map(([category, name]) => ({ category, name }));
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
  const cases = await search(q, qFilters, 1, pageSize, page - 1);
  const unfetchedFilters = [
    {
      name: "cause",
      displayName: "案由",
      promise: retrieveChildFilters("cause", []),
    },
    {
      name: "type",
      displayName: "参照级别",
      promise: retrieveFilters("type"),
    },
    {
      name: "trialProcedure",
      displayName: "审判程序",
      promise: retrieveFilters("trialProcedure"),
    },
    {
      name: "judgedAt",
      displayName: "审判时间",
      promise: retrieveTimeFilters("judgedAt"),
    },
    {
      name: "courtLevel",
      displayName: "法院级别",
      promise: retrieveFilters("courtLevel"),
    },
  ];

  const filters = await Promise.all(
    unfetchedFilters.map(async f => {
      const filters = await f.promise;
      return {
        ...f,
        filters: filters.map(f => ({ ...f, selected: false })),
      };
    }),
  );
  return { cases, filters, q, qFilters, page, pageSize };
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const cases = CaseSchema.array().parse(loaderData.cases);
  const loaderFilters = FilterCategorySchema.array().parse(loaderData.filters);
  const [searchParams, setSearchParams] = useSearchParams();

  const form = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  const [filters, setFilters] = useState<FilterCategory[]>(loaderFilters);
  const [selectedFilters, setSelectedFilters] = useState<{ category: string; name: string }[]>([]);
  const [q, setQ] = useState(loaderData.q);

  useEffect(() => {
    setFilters(loaderFilters);
  }, [loaderData.filters]);

  useEffect(() => {
    setQ(loaderData.q);
  }, [loaderData.q]);

  useEffect(() => {
    setSelectedFilters(loaderData.qFilters);
  }, [loaderData.qFilters]);


  const getPageSearch = useCallback(
    (page: number) => {
      const searchParamsNew = new URLSearchParams(searchParams);
      searchParamsNew.set("page", page.toString());
      return `?${searchParamsNew.toString()}`;
    },
    [searchParams],
  );

  const casesArea = useMemo(
    () => (
      <div className="flex grow flex-col">
        {mapWithDivider(
          cases,
          (c, i) => (
            <CaseCard
              key={c.id}
              serialNumber={(loaderData.page - 1) * loaderData.pageSize + i + 1}
              case={c}
            />
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
                <PaginationPrevious
                  to={{
                    search: getPageSearch(Math.max(loaderData.page - 1, 1)),
                  }}
                ></PaginationPrevious>
              </PaginationItem>
              {loaderData.page > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                {[
                  Math.max(loaderData.page - 1, 1),
                  Math.max(loaderData.page - 1, 1) + 1,
                  Math.max(loaderData.page - 1, 1) + 2,
                ].map(page => (
                  <PaginationLink
                    key={page}
                    to={{
                      search: getPageSearch(page),
                    }}
                    isActive={loaderData.page == page}
                  >
                    {page}
                  </PaginationLink>
                ))}
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  to={{
                    search: getPageSearch(loaderData.page + 1),
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    ),
    [cases],
  );

  const startContent = useMemo(
    () =>
      selectedFilters.map(f => (
        <FilterChip
          key={`${f.category}:${f.name}`}
          filter={{
            category: f.category,
            name: f.name,
            categoryDisplayName: filters
              .find(fc => fc.name === f.category)?.displayName || "未知分类",
          }}
          name="qFilters"
          className="mr-2"
          onClick={filter => {
            setSelectedFilters(selectedFilters.filter(sf => sf.category !== filter.category || sf.name !== filter.name));
          }}
        />
      )),
    [selectedFilters],
  );

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
          startContent={startContent}
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
          {filters.map(filter => (
            <FilterCard
              key={filter.name}
              filter={filter}
              onFilterChanged={f => setFilters(filters.map(ff => (ff.name === f.name ? f : ff)))}
              selectedFilters={selectedFilters.filter(sf => sf.category === filter.name).map(sf => sf.name)}
              onSelectedFiltersChange={selectedFiltersInCategory =>
                setSelectedFilters(
                  selectedFilters
                    .filter(sf => sf.category !== filter.name)
                    .concat(selectedFiltersInCategory.map(f => ({ category: filter.name, name: f }))),
                )
              }
            />
          ))}
        </div>
        {casesArea}
      </div>
    </div>
  );
}
