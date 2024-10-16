import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mapWithDivider<T, U>(
  arr: T[],
  fn: (item: T, index: number) => U,
  dividerFn: (item: T, index: number) => U,
) {
  return arr.reduce<U[]>(
    (acc, item, index) =>
      index > 0
        ? [...acc, dividerFn(item, index), fn(item, index)]
        : [fn(item, index)],
    [],
  );
}
