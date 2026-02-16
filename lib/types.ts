export type Tip = {
  id: number;
  title: string;
  content: string;
};

export type CatalogLink = {
  name: string;
  url: string;
};

export type CatalogItem = {
  name: string;
  image?: string;
  link?: string;
  links?: CatalogLink[];
  categories: string[];
  custom?: boolean | string;
  blank?: boolean | string;
  dy?: boolean | string;
  local?: boolean | string;
  local2?: boolean | string;
  error?: boolean | string;
  partial?: boolean | string;
  load?: boolean | string;
  say?: string;
};
