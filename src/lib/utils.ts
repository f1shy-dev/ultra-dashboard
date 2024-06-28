import { type ClassValue, clsx } from "clsx";
import { Fetcher } from "swr";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const swrFetcher = (url: string) => fetch(url).then((res) => res.json());
export const tsvFetcher: Fetcher<Record<number, string>> = (url: string) =>
  fetch(url)
    .then((res) => res.text())
    .then((data) =>
      Object.fromEntries(
        data
          .split("\n")
          .map((line) => line.split("\t"))
          .map(([id, name]) => [Number(id), name])
      )
    );

export const isBrowser = typeof window !== "undefined";
export const isNavigator = typeof navigator !== "undefined";
export const noop = () => {};

export const generateShortUUID = () => {
  let d = new Date().getTime();
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  return "xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (r | 0x8).toString(16);
  });
};
