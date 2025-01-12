import { type UserScansRootParams } from "./UserScansRootParams";

export type UserScansRootRouter = {
    params: Readonly<Partial<UserScansRootParams>>;
    searchParams: URLSearchParams;
    setSearchParams: (searchParams: URLSearchParams) => void;
};
