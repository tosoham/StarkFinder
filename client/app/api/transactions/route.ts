/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from "next/server";
import OpenAI from "openai";
import { transactionProcessor } from "@/lib/transaction";
import { TRANSACTION_INTENT_PROMPT } from "@/prompts/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

async function getTransactionIntentFromOpenAI(
  prompt: string,
  address: string,
  chainId: string,
  messages: any[]
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${TRANSACTION_INTENT_PROMPT}\n\nAdditional Context:\nCurrent Chain ID: ${chainId}`,
        },
        { role: "user", content: prompt },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
    });

    const intentData = JSON.parse(response.choices[0].message.content || "{}");

    if (!intentData.isTransactionIntent) {
      throw new Error("Not a transaction-related prompt");
    }

    const transactionIntent = {
      solver: intentData.solver || "OpenAI-Intent-Recognizer",
      action: intentData.action,
      type: "write",
      extractedParams: {
        action: intentData.extractedParams.action,
        token1: intentData.extractedParams.token1 || "",
        token2: intentData.extractedParams.token2 || "",
        chain: intentData.extractedParams.chain || "",
        amount: intentData.extractedParams.amount || "",
        protocol: intentData.extractedParams.protocol || "",
        address: intentData.extractedParams.address || address,
        dest_chain: intentData.extractedParams.dest_chain || "",
        destinationAddress:
          intentData.extractedParams.destinationAddress || address,
      },
      data: {
        description: "",
        steps: [],
        ...(["swap", "transfer"].includes(intentData.action)
          ? {
              fromToken: {
                symbol: intentData.extractedParams.token1 || "",
                address: intentData.extractedParams.address || "",
                decimals: 1, // default, adjust if needed
              },
              toToken: {
                symbol: intentData.extractedParams.token2 || "",
                address: intentData.extractedParams.address || "",
                decimals: 1, // default, adjust if needed
              },
              fromAmount: intentData.extractedParams.amount,
              toAmount: intentData.extractedParams.amount,
              receiver: intentData.extractedParams.address,
            }
          : {}),
        ...(intentData.action === "bridge"
          ? {
              bridge: {
                sourceNetwork: intentData.extractedParams.chain || "",
                destinationNetwork: intentData.extractedParams.dest_chain || "",
                sourceToken: intentData.extractedParams.token1 || "",
                destinationToken: intentData.extractedParams.token2 || "",
                amount: parseFloat(intentData.extractedParams.amount || "0"),
                sourceAddress: address,
                destinationAddress:
                  intentData.extractedParams.destinationAddress || address,
              },
            }
          : {}),
        ...(["deposit", "withdraw"].includes(intentData.action)
          ? {
              protocol: intentData.extractedParams.protocol,
              fromAmount: intentData.extractedParams.amount,
              toAmount: intentData.extractedParams.amount,
              receiver: intentData.extractedParams.address,
            }
          : {}),
      },
    };

    return transactionIntent;
  } catch (error) {
    console.error("Error fetching transaction intent:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, address, messages = [], chainId = "4012" } = body;

    if (!prompt || !address) {
      return NextResponse.json(
        { error: "Missing required parameters (prompt or address)" },
        { status: 400 }
      );
    }

    try {
      const transactionIntent = await getTransactionIntentFromOpenAI(
        prompt,
        address,
        chainId,
        messages
      );
      console.log(
        "Processed Transaction Intent from OPENAI:",
        JSON.stringify(transactionIntent, null, 2)
      );

      const processedTx = await transactionProcessor.processTransaction(
        transactionIntent
      );
      console.log(
        "Processed Transaction:",
        JSON.stringify(processedTx, null, 2)
      );

      if (["deposit", "withdraw"].includes(transactionIntent.action)) {
        processedTx.receiver = address;
      }

      return NextResponse.json({
        result: [
          {
            data: {
              description: processedTx.description,
              transaction: {
                type: processedTx.action,
                data: {
                  transactions: processedTx.transactions,
                  fromToken: processedTx.fromToken,
                  toToken: processedTx.toToken,
                  fromAmount: processedTx.fromAmount,
                  toAmount: processedTx.toAmount,
                  receiver: processedTx.receiver,
                  gasCostUSD: processedTx.estimatedGas,
                  solver: processedTx.solver,
                  protocol: processedTx.protocol,
                  bridge: processedTx.bridge,
                },
              },
            },
            conversationHistory: messages,
          },
        ],
      });
    } catch (error) {
      console.error("Transaction processing error:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Transaction processing failed",
          details: error instanceof Error ? error.stack : undefined,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
