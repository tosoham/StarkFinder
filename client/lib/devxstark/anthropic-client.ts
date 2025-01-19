import { ChatAnthropic } from "@langchain/anthropic";

export const createAnthropicClient = () => {
    return new ChatAnthropic({
        modelName: "claude-3-5-sonnet-20241022",
        temperature: 0.2,
        maxTokens: undefined,
        maxRetries: 3,
        clientOptions: {
            defaultHeaders: {
                "anthropic-beta": "prompt-caching-2024-07-31"
            }
        }
    });
};
