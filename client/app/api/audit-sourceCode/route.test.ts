import { testApiHandler } from "next-test-api-route-handler"; // Must always be first
import * as appHandler from "./route";
import { matchers } from "jest-json-schema";
expect.extend(matchers);

it("audit contract successfully", async () => {
  await testApiHandler({
    appHandler,
    test: async ({ fetch }) => {
      const body = { sourceCode: JSON.stringify(example_contract) };

      const response = await fetch({
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const json = await response.json();

      expect(response.status).toBe(200);

      expect(json).toHaveProperty("result");

      const result = JSON.parse(json.result);

      // console.log(result);

      expect(result).toMatchSchema(outputSchema);
    },
  });
}, 50000);

it("returns 400 if sourceCode is missing", async () => {
  await testApiHandler({
    appHandler,
    test: async ({ fetch }) => {
      const response = await fetch({
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });

      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error");
      expect(json.error).toBe("`sourceCode` is required in the request body.");
    },
  });
});

it("returns 400 if sourceCode is not a string", async () => {
  await testApiHandler({
    appHandler,
    test: async ({ fetch }) => {
      const response = await fetch({
        method: "POST",
        body: JSON.stringify({ sourceCode: 12345 }),
        headers: { "Content-Type": "application/json" },
      });

      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error");
      expect(json.error).toBe("`sourceCode` is required in the request body.");
    },
  });
});

export const outputSchema = {
  type: "object",
  properties: {
    contract_name: { type: "string" },
    audit_date: { type: "string" },
    security_score: { type: "number", minimum: 0, maximum: 100 },
    original_contract_code: { type: "string" },
    corrected_contract_code: { type: "string" },
    vulnerabilities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          severity: { type: "string", enum: ["Low", "Medium", "High"] },
          description: { type: "string" },
          recommended_fix: { type: "string" },
        },
        required: ["category", "severity", "description", "recommended_fix"],
        additionalProperties: false,
      },
    },
    recommended_fixes: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "contract_name",
    "audit_date",
    "security_score",
    "original_contract_code",
    "corrected_contract_code",
    "vulnerabilities",
    "recommended_fixes",
  ],
  additionalProperties: false,
};

const example_contract = `
    #[starknet::interface]
    pub trait ICounter<TContractState> {
        fn increment(ref self: TContractState, amount: u128);
        fn get_count(self: @TContractState) -> u128;
    }

    #[starknet::contract]
    mod counter {
        use super::ICounter;

        #[storage]
        struct Storage {
            counter: u128,
        }

        #[constructor]
        fn constructor(ref self: Storage, initial_value: u128) {
            self.counter.write(0);
        }

        #[abi(embed_v0)]
        impl CounterImpl of ICounter<ContractState> {
            fn increment(ref self: ContractState, amount: u128) {
                let current = self.counter.read();
                self.counter.write(current - amount);
            }

            fn get_count(self: @ContractState) -> u128 {
                self.counter.read() + 1
            }
        }
    }
`;
