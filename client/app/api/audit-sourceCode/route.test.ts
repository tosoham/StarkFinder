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

      expect(response.status).toBe(200);

      let accumulatedCode = "";

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;

        while (!done) {
          console.log("Reading from stream...");
          const { value, done: isDone } = await reader.read();
          done = isDone;

          console.log(
            `Read status: done=${done}, value length=${
              value ? value.length : 0
            }`
          );

          if (value) {
            const decodedValue = decoder.decode(value);
            try {
              const parsedValue = JSON.parse(decodedValue);
              if (parsedValue.error) {
                console.error("Error received from stream:", parsedValue.error);
                throw new Error(parsedValue.error);
              } else {
                // If it's valid JSON but not an error, update source code
                accumulatedCode += decodedValue;
                console.log("Accumulated code updated (JSON chunk).");
              }
            } catch {
              // If it's not valid JSON, just treat it as regular text
              accumulatedCode += decodedValue;
              console.log("Accumulated code updated (text chunk).");
            }
          }
        }
        console.log("Finished reading from stream.");
      }

      const finalReport = extractJSON(accumulatedCode);

      const finalReportJson = JSON.parse(finalReport);

      // console.log(finalReportJson);

      expect(finalReportJson).toMatchSchema(outputSchema);
    },
  });
}, 10000000);

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

export function extractJSON(text: string) {
  const codeBlockMatch = text.match(/```json\n([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const bracketMatch = text.match(/\{[\s\S]*\}/);
  if (bracketMatch) return bracketMatch[0].trim();
  const cleanedText = text.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
  return cleanedText;
}
