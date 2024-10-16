import { LoaderFunctionArgs } from "@remix-run/node";
import { retrieveChildFilters } from "~/lib/database/case.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // parse the search params for `?q=`
  const url = new URL(request.url);
  const filterCategoryName = url.searchParams.get("filterCategoryName");
  const filterPath = url.searchParams.get("filterPath")?.split("|");
  if (!filterCategoryName || !filterPath) {
    return new Response("Bad Request", { status: 400 });
  }
  const result = await retrieveChildFilters(filterCategoryName, filterPath);
  // console.log(result);
  return result.map(filter => ({
    ...filter,
    selected: false,
  }));
}
