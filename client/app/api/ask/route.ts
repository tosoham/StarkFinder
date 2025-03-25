import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return new NextResponse(
        JSON.stringify({ error: "Message is required" }),
        { status: 400 }
      );
    }

    // Attempt OpenAI API call
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      }),
    });

    if (openaiResponse.ok) {
      const data = await openaiResponse.json();
      return new NextResponse(
        JSON.stringify({ response: data.choices[0].message.content }),
        { status: 200 }
      );
    } else {
      console.error("OpenAI API call failed, falling back to BrianAI");
      // Fallback to BrianAI API call if OpenAI fails
      const brianResponse = await fetch("https://api.brianai.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.BRIAN_API_KEY}`,
        },
        body: JSON.stringify({ message }),
      });

      if (brianResponse.ok) {
        const data = await brianResponse.json();
        return new NextResponse(
          JSON.stringify({ response: data.reply }),
          { status: 200 }
        );
      }
      // If both APIs fail
      return new NextResponse(
        JSON.stringify({ error: "Both OpenAI and BrianAI failed" }),
        { status: 500 }
      );
    }
  } catch (_error) {
    return new NextResponse(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500 }
    );
  }
}
