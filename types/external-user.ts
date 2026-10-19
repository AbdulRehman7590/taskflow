export type ExternalUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  image: string;
  age: number;
  company: string;
  jobTitle: string;
  department: string;
  location: string;
};

export type ExternalUserPage = {
  items: ExternalUser[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
