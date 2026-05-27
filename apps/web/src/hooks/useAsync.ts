import { useCallback, useState } from "react";

export type AsyncState<T> =
  | { status: "idle"; data?: undefined; error?: undefined }
  | { status: "loading"; data?: T; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "error"; data?: T; error: unknown };

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });

  const run = useCallback(async (operation: () => Promise<T>): Promise<T> => {
    setState((current) => ({
      status: "loading",
      ...(current.data === undefined ? {} : { data: current.data })
    }));

    try {
      const data = await operation();
      setState({ status: "success", data });
      return data;
    } catch (error) {
      setState((current) => ({
        status: "error",
        ...(current.data === undefined ? {} : { data: current.data }),
        error
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, run, reset, setState };
}
