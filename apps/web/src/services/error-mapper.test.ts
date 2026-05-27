import { APP_ERROR_CODES } from "@casecellshop/shared";
import { describe, expect, it } from "vitest";

import { mapErrorCode } from "./error-mapper";

describe("mapErrorCode", () => {
  it("maps every shared app error code to a user-facing message", () => {
    for (const code of Object.values(APP_ERROR_CODES)) {
      expect(mapErrorCode(code)).toEqual(expect.any(String));
      expect(mapErrorCode(code).length).toBeGreaterThan(0);
    }
  });
});
