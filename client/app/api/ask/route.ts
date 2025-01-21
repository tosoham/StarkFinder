/* eslint-disable @typescript-eslint/no-explicit-any */
// api/ask/route.ts
import { NextResponse } from "next/server";
import { ASK_OPENAI_AGENT_PROMPT } from "@/prompts/prompts";
import axios from "axios";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import {
  START,
  END,
  MessagesAnnotation,
  MemorySaver,
  StateGraph,
} from "@langchain/langgraph";
import { RemoveMessage } from "@langchain/core/messages";


const BRIAN_API_KEY = process.env.BRIAN_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const BRIAN_API_URL = "https://api.brianknows.org/api/v0/agent/knowledge";
const BRIAN_DEFAULT_RESPONSE: string =
  "🤖 Sorry, I don’t know how to answer. The AskBrian feature allows you to ask for information on a custom-built knowledge base of resources. Contact the Brian team if you want to add new resources!";

const systemPrompt =
  ASK_OPENAI_AGENT_PROMPT +
  `\nThe provided chat history includes a summary of the earlier conversation.`;

const systemMessage = SystemMessagePromptTemplate.fromTemplate([systemPrompt]);

const userMessage = HumanMessagePromptTemplate.fromTemplate(["{user_query}"]);

const askAgentPromptTemplate = ChatPromptTemplate.fromMessages([
  systemMessage,
  userMessage,
]);

if (!OPENAI_API_KEY) {
  throw new Error("OpenAI API key is missing");
}

const agent = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.5,
  openAIApiKey: OPENAI_API_KEY,
});
const prompt = askAgentPromptTemplate;
// const chain = prompt.pipe(agent);
const initialCallModel = async (state: typeof MessagesAnnotation.State) => {
  const messages = [
    await systemMessage.format({ brianai_answer: BRIAN_DEFAULT_RESPONSE }),
    ...state.messages,
  ];
  const response = await agent.invoke(messages);
  return { messages: response };
};
const callModel = async (state: typeof MessagesAnnotation.State) => {
  const messageHistory = state.messages.slice(0, -1);
  if (messageHistory.length >= 3) {
    const lastHumanMessage = state.messages[state.messages.length - 1];
    const summaryPrompt = `
    Distill the above chat messages into a single summary message. 
    Include as many specific details as you can.
    IMPORTANT NOTE: Include all information related to user's nature about trading and what kind of trader he/she is. 
    `;
    // const summaryMessage = HumanMessagePromptTemplate.fromTemplate([summaryPrompt]);
    const summary = await agent.invoke([
      ...messageHistory,
      { role: "user", content: summaryPrompt },
    ]);
    const deleteMessages = state.messages.map((m) =>
      m.id ? new RemoveMessage({ id: m.id }) : null
    );
    const humanMessage = { role: "user", content: lastHumanMessage.content };
    const response = await agent.invoke([
      await systemMessage.format({ brianai_answer: BRIAN_DEFAULT_RESPONSE }),
      summary,
      humanMessage,
    ]);
    //console.log(response);
    return {
      messages: [summary, humanMessage, response, ...deleteMessages],
    };
  } else {
    return await initialCallModel(state);
  }
};

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);
const app = workflow.compile({ checkpointer: new MemorySaver() });

async function queryOpenAI({
  userQuery,
  brianaiResponse,
}: {
  userQuery: string;
  brianaiResponse: string;
}): Promise<string> {
  try {
    const response = await app.invoke(
      {
        messages: [
          await prompt.format({
            brianai_answer: brianaiResponse,
            user_query: userQuery,
          }),
        ],
      },
      {
        configurable: { thread_id: "1" },
      }
    );
    console.log(response);
    return response.messages[response.messages.length - 1].content as string;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "Sorry, I am unable to process your request at the moment.";
  }
}

async function queryBrianAI(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      BRIAN_API_URL,
      {
        prompt,
        kb: "starknet_kb",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-brian-api-key": BRIAN_API_KEY,
        },
      }
    );
    const brianaiAnswer = response.data.result.answer;
    const openaiAnswer = await queryOpenAI({
      brianaiResponse: brianaiAnswer,
      userQuery: prompt,
    });
    return openaiAnswer;
  } catch (error) {
    console.error("Brian AI Error:", error);
    return "Sorry, I am unable to process your request at the moment.";
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, address, messages } = await request.json();

    // Filter out duplicate messages and only keep user messages
    const uniqueMessages = messages
      .filter((msg: any) => msg.sender === "user")
      .reduce((acc: any[], curr: any) => {
        // Only add if message content isn't already present
        if (!acc.some((msg) => msg.content === curr.content)) {
          acc.push({
            sender: "user",
            content: curr.content,
          });
        }
        return acc;
      }, []);

    const payload = {
      prompt,
      address: address || "0x0",
      chainId: "4012",
      messages: uniqueMessages,
    };

    console.log("Request payload:", JSON.stringify(payload, null, 2));

    const response = await queryBrianAI(payload.prompt);

    console.log("API Response:", response);

    // Extract the answer from the result array
    if (response) {
      return NextResponse.json({ answer: response });
    } else {
      throw new Error("Unexpected API response format");
    }
  } catch (error: any) {
    console.error("Detailed error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    return NextResponse.json(
      {
        error: "Unable to get response from Brian's API",
        details: error.response?.data || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
