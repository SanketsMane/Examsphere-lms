export type ApiResponse = {
  status: "success" | "error";

  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  /**
   * Per-field validation messages, keyed by form field name.
   * Lets a form highlight the offending input instead of showing a single
   * opaque "Invalid Form Data" toast.
   */
  fieldErrors?: Record<string, string>;
};
