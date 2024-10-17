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
      index > 0 ? [...acc, dividerFn(item, index), fn(item, index)] : [fn(item, index)],
    [],
  );
}

export function generateColor(key: string) {
  const hash = key.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const colors = [
    {
      text: "text-red-500",
      bg: "bg-red-200",
    },
    {
      text: "text-yellow-500",
      bg: "bg-yellow-200",
    },
    {
      text: "text-green-500",
      bg: "bg-green-200",
    },
    {
      text: "text-blue-500",
      bg: "bg-blue-200",
    },
    {
      text: "text-indigo-500",
      bg: "bg-indigo-200",
    },
    {
      text: "text-purple-500",
      bg: "bg-purple-200",
    },
    {
      text: "text-pink-500",
      bg: "bg-pink-200",
    },
    {
      text: "text-orange-500",
      bg: "bg-orange-200",
    },
    {
      text: "text-cyan-500",
      bg: "bg-cyan-200",
    },
  ];

  const index = Math.abs(hash) % colors.length;

  return colors[index];
}
