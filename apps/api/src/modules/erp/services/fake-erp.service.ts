export const ERP_TEST_OUTCOMES = {
  CONFIRMED: "confirmed",
  DELAYED: "delayed",
  TEMPORARY_FAILURE: "temporary_failure"
} as const;

export type ErpTestOutcome =
  (typeof ERP_TEST_OUTCOMES)[keyof typeof ERP_TEST_OUTCOMES];

export type ErpProcessingResult =
  | {
      outcome: "confirmed";
      erpReference: string;
    }
  | {
      outcome: "delayed";
    }
  | {
      outcome: "temporary_failure";
    };

export interface ErpGatewayPort {
  processOrder: (input: {
    orderId: string;
    testOutcome?: string;
  }) => Promise<ErpProcessingResult>;
}

function normalizeOutcome(testOutcome: string | undefined): ErpTestOutcome {
  if (
    testOutcome === ERP_TEST_OUTCOMES.DELAYED ||
    testOutcome === ERP_TEST_OUTCOMES.TEMPORARY_FAILURE
  ) {
    return testOutcome;
  }

  return ERP_TEST_OUTCOMES.CONFIRMED;
}

export class FakeErpService implements ErpGatewayPort {
  async processOrder(input: {
    orderId: string;
    testOutcome?: string;
  }): Promise<ErpProcessingResult> {
    const outcome = normalizeOutcome(
      input.testOutcome ?? process.env.FAKE_ERP_OUTCOME
    );

    if (outcome === ERP_TEST_OUTCOMES.DELAYED) {
      return { outcome: "delayed" };
    }

    if (outcome === ERP_TEST_OUTCOMES.TEMPORARY_FAILURE) {
      return { outcome: "temporary_failure" };
    }

    return {
      outcome: "confirmed",
      erpReference: `ERP-${input.orderId.slice(0, 8)}`
    };
  }
}
