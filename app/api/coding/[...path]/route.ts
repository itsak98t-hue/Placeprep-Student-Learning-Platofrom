import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getCodingBackendBaseUrl() {
  return (
    process.env.CODING_ML_API_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_CODING_ML_API_URL?.trim().replace(/\/$/, "") ||
    ""
  )
}

async function proxyRequest(request: NextRequest, path: string[]) {
  const baseUrl = getCodingBackendBaseUrl()
  const route = path[0] ?? ""

  if (!baseUrl) {
    if (route === "user-stats" && request.method === "GET") {
      return NextResponse.json(
        { solved: 0, attempted: 0, accuracy: 0 },
        { status: 200 }
      )
    }
    if (route === "recommend" && request.method === "POST") {
      return NextResponse.json(
        { question: null, source: "fallback" },
        { status: 200 }
      )
    }
    return NextResponse.json(
      { detail: "Coding backend is not configured." },
      { status: 500 }
    )
  }

  const incomingUrl = new URL(request.url)
  const targetUrl = `${baseUrl}/${path.join("/")}${incomingUrl.search}`

  console.log("[/api/coding] proxy input", {
    method: request.method,
    path: path.join("/"),
    targetUrl,
  })

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
    })

    const text = await response.text()

    console.log("[/api/coding] proxy output", {
      method: request.method,
      path: path.join("/"),
      status: response.status,
    })

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    })
  } catch (error) {
    console.error("[/api/coding] proxy error", error)
    if (route === "user-stats" && request.method === "GET") {
      return NextResponse.json(
        { solved: 0, attempted: 0, accuracy: 0 },
        { status: 200 }
      )
    }
    if (route === "recommend" && request.method === "POST") {
      return NextResponse.json(
        { question: null, source: "fallback" },
        { status: 200 }
      )
    }
    return NextResponse.json(
      { detail: "Coding backend is not configured." },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request, context.params.path)
}

export async function POST(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return proxyRequest(request, context.params.path)
}
