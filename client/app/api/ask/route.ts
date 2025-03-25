import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (openAiResponse.ok) {
      const data = await openAiResponse.json();
      return NextResponse.json({ response: data.choices[0].message.content });
    }

    // Fallback to BrianAI if OpenAI fails
    const brianResponse = await fetch('https://api.brianai.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BRIAN_API_KEY}`,
      },
      body: JSON.stringify({ message }),
    });

    if (brianResponse.ok) {
      const data = await brianResponse.json();
      return NextResponse.json({ response: data.reply });
    }

    return NextResponse.json({ error: 'Both OpenAI and BrianAI failed' }, { status: 500 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
