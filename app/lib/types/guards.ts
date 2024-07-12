export const isTruthy = <T>(o: T | undefined | null | false | 0 | ""): o is T =>
  !!o;
