export type PageParams<T extends Record<string, string>> = {
  params: T;
  searchParams?: { [key: string]: string | string[] | undefined };
};