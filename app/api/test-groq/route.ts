import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'GROQ_API_KEY is missing on Vercel' }, { status: 500 })
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        max_tokens: 10
      })
    })
    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: 'Groq rejected key', detail: data }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      keyPresent: true,
      response: data.choices?.[0]?.message?.content
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}