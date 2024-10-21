import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  Await,
  defer,
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { Search } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CaseCard, CaseCardSkeleton } from "~/components/app/case-card";
import { FilterCard } from "~/components/app/filter-card";
import { FilterChip } from "~/components/app/filter-chip";
import { LawCard } from "~/components/app/law-card";
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
import { Spinner } from "~/components/ui/spinner";
import {
  retrieveChildFilters,
  retrieveFilters,
  retrieveTimeFilters,
  search,
  searchForLaws,
} from "~/lib/database/case.server";
import { Case, CaseSchema } from "~/lib/types/case";
import { FilterCategory, FilterCategorySchema } from "~/lib/types/filter";
import { Law } from "~/lib/types/law";
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
  const collection = url.searchParams.get("collection") || "law";
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
  const cases: Promise<Case[]> | false =
    collection === "case" && search({ query: q, filters: qFilters, pageSize, page: page - 1 });
  const laws: Promise<Law[]> | false =
    collection === "law" && searchForLaws({ query: q, pageSize, page: page - 1 });
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
  return defer({ cases, laws, filters, q, qFilters, page, pageSize, collection });
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const loaderFilters = FilterCategorySchema.array().parse(loaderData.filters);
  const [searchParams, setSearchParams] = useSearchParams();

  const form = useRef<HTMLFormElement>(null);
  const submit = useSubmit();

  const [filters, setFilters] = useState<FilterCategory[]>(loaderFilters);
  const [selectedFilters, setSelectedFilters] = useState<{ category: string; name: string }[]>([]);
  const [q, setQ] = useState(loaderData.q);

  const navigate = useNavigate();

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

  const getCollectionSearch = useCallback(
    (collection: string) => {
      const searchParamsNew = new URLSearchParams(searchParams);
      // Reset page to 1 when switching collection
      searchParamsNew.set("page", "1");
      searchParamsNew.set("collection", collection);
      return `?${searchParamsNew.toString()}`;
    },
    [searchParams],
  );

  const navigation = useNavigation();

  const pagination = useMemo(
    () => (
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
    ),
    [loaderData.page],
  );

  const casesArea = useMemo(
    () =>
      loaderData.cases && (
        <div className="flex grow flex-col">
          <Suspense
            fallback={mapWithDivider(
              new Array(loaderData.pageSize).fill(0),
              (_, i) => (
                <CaseCardSkeleton key={i} />
              ),
              (_, i) => (
                <div key={`divider-${i}`} className="border-b border-border"></div>
              ),
            )}
          >
            <Await resolve={loaderData.cases}>
              {cases => (
                <>
                  <Spinner
                    show={
                      navigation.location?.pathname === "/" &&
                      navigation.formMethod === "GET" &&
                      navigation.state === "loading"
                    }
                    size="large"
                    className="w-12 h-12 mb-8"
                  />
                  {mapWithDivider(
                    CaseSchema.array().parse(cases),
                    (c, i) => (
                      <CaseCard
                        key={c.name}
                        serialNumber={(loaderData.page - 1) * loaderData.pageSize + i + 1}
                        case={c}
                      />
                    ),
                    (_, i) => (
                      <div key={`divider-${i}`} className="border-b border-border"></div>
                    ),
                  )}
                </>
              )}
            </Await>
          </Suspense>
          <div className="border-b border-border"></div>
          {pagination}
        </div>
      ),
    [loaderData, navigation],
  );

  const lawsArea = useMemo(
    () =>
      loaderData.laws && (
        <div className="flex grow flex-col">
          <Suspense
            fallback={mapWithDivider(
              new Array(loaderData.pageSize).fill(0),
              (_, i) => (
                <CaseCardSkeleton key={i} />
              ),
              (_, i) => (
                <div key={`divider-${i}`} className="border-b border-border"></div>
              ),
            )}
          >
            <Await resolve={loaderData.laws}>
              {laws => (
                <>
                  <Spinner
                    show={
                      navigation.location?.pathname === "/" &&
                      navigation.formMethod === "GET" &&
                      navigation.state === "loading"
                    }
                    size="large"
                    className="w-12 h-12 mb-8"
                  />
                  {mapWithDivider(
                    laws,
                    (l, i) => (
                      <LawCard key={l.title} serialNumber={i + 1} law={l} />
                    ),
                    (_, i) => (
                      <div key={`divider-${i}`} className="border-b border-border"></div>
                    ),
                  )}
                </>
              )}
            </Await>
          </Suspense>
          <div className="border-b border-border"></div>
          {pagination}
        </div>
      ),
    [loaderData, navigation],
  );

  const startContent = useMemo(
    () =>
      selectedFilters.map(f => (
        <FilterChip
          key={`${f.category}:${f.name}`}
          filter={{
            category: f.category,
            name: f.name,
            categoryDisplayName:
              filters.find(fc => fc.name === f.category)?.displayName || "未知分类",
          }}
          name="qFilters"
          className="mr-2"
          onClick={filter => {
            setSelectedFilters(
              selectedFilters.filter(
                sf => sf.category !== filter.category || sf.name !== filter.name,
              ),
            );
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
        <input type="hidden" name="collection" value={loaderData.collection} />
      </Form>
      <div className="flex gap-8">
        <div className="flex basis-80 flex-col gap-4 shrink-0">
          {filters.map(filter => (
            <FilterCard
              key={filter.name}
              filter={filter}
              onFilterChanged={f => setFilters(filters.map(ff => (ff.name === f.name ? f : ff)))}
              selectedFilters={selectedFilters
                .filter(sf => sf.category === filter.name)
                .map(sf => sf.name)}
              onSelectedFiltersChange={selectedFiltersInCategory =>
                setSelectedFilters(
                  selectedFilters
                    .filter(sf => sf.category !== filter.name)
                    .concat(
                      selectedFiltersInCategory.map(f => ({ category: filter.name, name: f })),
                    ),
                )
              }
            />
          ))}
        </div>
        <div className="flex flex-col gap-4 grow">
          <div className="flex w-full space-x-2">
            <Button
              variant={loaderData.collection === "law" ? "default" : "outline"}
              className="flex-1"
              onClick={() =>
                navigate({
                  search: getCollectionSearch("law"),
                })
              }
            >
              法律法规
            </Button>
            <Button
              variant={loaderData.collection === "case" ? "default" : "outline"}
              className="flex-1"
              onClick={() =>
                navigate({
                  search: getCollectionSearch("case"),
                })
              }
            >
              裁判文书
            </Button>
          </div>
          {casesArea}
          {lawsArea}
        </div>
      </div>
    </div>
  );
}
