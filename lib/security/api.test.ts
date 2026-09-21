import {
  describe,
  expect,
  it,
} from "vitest";

import {
  GET,
  POST,
} from "../../app/api/security/experiment/route";

function createRequestBody(
  overrides: Record<
    string,
    unknown
  > = {},
) {
  return {
    experimentId:
      `API-EXP-${Date.now()}-${Math.random()}`,

    sessionId:
      `API-SESSION-${Date.now()}-${Math.random()}`,

    signatureId:
      `API-SIG-${Date.now()}-${Math.random()}`,

    signerId:
      "API-SIGNER-001",

    message:
      "Q-SHIELD API test",

    nonce:
      `API-NONCE-${Date.now()}-${Math.random()}`,

    alpha:
      1,

    beta:
      0,

    shots:
      1000,

    threshold:
      0.1,

    seed:
      42,

    ...overrides,
  };
}

describe(
  "Q-SHIELD security API",
  () => {
    it(
      "reports the engine as operational",
      async () => {
        const response =
          await GET();

        expect(
          response.status,
        ).toBe(200);

        const body =
          await response.json();

        expect(
          body.service,
        ).toBe(
          "Q-SHIELD Security Engine",
        );

        expect(
          body.status,
        ).toBe(
          "operational",
        );

        expect(
          body.engine,
        ).toBe(
          "deterministic",
        );

        expect(
          body.aiAdvisory,
        ).toBe(
          "optional",
        );
      },
    );

    it(
      "runs a security experiment through POST",
      async () => {
        const request =
          new Request(
            "http://localhost/api/security/experiment",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                createRequestBody(),
              ),
            },
          );

        const response =
          await POST(request);

        expect(
          response.status,
        ).toBe(200);

        const body =
          await response.json();

        expect(
          body.success,
        ).toBe(true);

        expect(
          body.experiment,
        ).toBeDefined();

        expect(
          body.experiment
            .experimentId,
        ).toBeDefined();

        expect(
          body.experiment
            .quantum,
        ).toBeDefined();

        expect(
          body.experiment
            .quantum
            .verification,
        ).toBeDefined();

        expect(
          body.event,
        ).toBeDefined();

        expect(
          body.telemetry,
        ).toBeDefined();
      },
    );

    it(
      "returns telemetry for a clean experiment",
      async () => {
        const request =
          new Request(
            "http://localhost/api/security/experiment",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                createRequestBody(),
              ),
            },
          );

        const response =
          await POST(request);

        const body =
          await response.json();

        expect(
          body.telemetry
            .threatDetected,
        ).toBe(false);

        expect(
          body.telemetry
            .threatType,
        ).toBe("NONE");

        expect(
          body.telemetry
            .verificationAccepted,
        ).toBe(true);
      },
    );

    it(
      "detects a replay through the API",
      async () => {
        const bodyData =
          createRequestBody();

        const firstRequest =
          new Request(
            "http://localhost/api/security/experiment",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                bodyData,
              ),
            },
          );

        const firstResponse =
          await POST(
            firstRequest,
          );

        expect(
          firstResponse.status,
        ).toBe(200);

        const secondRequest =
          new Request(
            "http://localhost/api/security/experiment",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                bodyData,
              ),
            },
          );

        const secondResponse =
          await POST(
            secondRequest,
          );

        expect(
          secondResponse.status,
        ).toBe(200);

        const secondBody =
          await secondResponse.json();

        expect(
          secondBody.experiment
            .threat
            .detected,
        ).toBe(true);

        expect(
          secondBody.experiment
            .threat
            .threatType,
        ).toBe("REPLAY");
      },
    );

    it(
      "rejects invalid request data",
      async () => {
        const request =
          new Request(
            "http://localhost/api/security/experiment",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                experimentId:
                  "INVALID",
              }),
            },
          );

        const response =
          await POST(request);

        expect(
          response.status,
        ).toBe(400);

        const body =
          await response.json();

        expect(
          body.success,
        ).toBe(false);

        expect(
          body.error,
        ).toBe(
          "Invalid experiment configuration.",
        );
      },
    );

    it(
      "rejects invalid shot counts",
      async () => {
        const request =
          new Request(
            "http://localhost/api/security/experiment",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                createRequestBody({
                  shots: 0,
                }),
              ),
            },
          );

        const response =
          await POST(request);

        expect(
          response.status,
        ).toBe(400);
      },
    );

    it(
      "rejects invalid threshold",
      async () => {
        const request =
          new Request(
            "http://localhost/api/security/experiment",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                createRequestBody({
                  threshold: 2,
                }),
              ),
            },
          );

        const response =
          await POST(request);

        expect(
          response.status,
        ).toBe(400);
      },
    );
  },
);