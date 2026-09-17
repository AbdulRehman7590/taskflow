export type FieldErrors = Record<string, string[]>;

export type ApiMessage = {
  message: string;
  fieldErrors?: FieldErrors;
};

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: FieldErrors };

export type RouteContext = { params: Promise<{ id: string }> };
