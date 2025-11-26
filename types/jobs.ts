export type JobCategory = 'all' | 'enkel' | 'fagarbeid';

export type JobFilters = {
  category: JobCategory;
  search: string;
  location?: string;
  maxPrice?: number;
  minPrice?: number;
};

export const JobCategories: Record<JobCategory, string> = {
  all: 'Alle jobber',
  enkel: 'Enkle jobber',
  fagarbeid: 'Fagarbeid',
};