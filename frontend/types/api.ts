export type ApiMessage = { message: string };
export type ApiUserResponse = { user: import("./auth").AuthUser };
export type RouteContext = { params: Promise<{ id: string }> };
