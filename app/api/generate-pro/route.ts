// app/api/generate-pro/route.ts
import { NextRequest } from "next/server";

const API_KEY = process.env.NANOBANANA_API_KEY;
const NANO_GENERATE_URL = "https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro";

if (!API_KEY) {
  console.warn("⚠️ Missing NANOBANANA_API_KEY in .env.local");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ 修正：使用正确的字段名 callbackUrl（全小写）
    const { prompt, resolution, aspectRatio, callbackUrl } = body;

    // === 参数校验 ===
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return Response.json(
        { code: 400, message: "Prompt is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!resolution || !["1K", "2K", "4K"].includes(resolution)) {
      return Response.json(
        { code: 400, message: "Invalid resolution. Must be one of: 1K, 2K, 4K." },
        { status: 400 }
      );
    }

    const validRatios = [
      "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"
    ];
    if (!aspectRatio || !validRatios.includes(aspectRatio)) {
      return Response.json(
        { code: 400, message: `Invalid aspectRatio. Must be one of: ${validRatios.join(", ")}` },
        { status: 400 }
      );
    }

    // === 构造 payload（使用正确字段名）===
    const payload = {
      prompt: prompt.trim(),
      imageUrls: [], // txt2img 留空
      resolution,
      aspectRatio,
      ...(callbackUrl && { callbackUrl }), // ✅ 正确：小写 c
    };

    // === 调用 NanoBanana API ===
    const res = await fetch(NANO_GENERATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    // === 处理响应 ===
    let apiResponse;
    try {
      apiResponse = await res.json();
    } catch (parseError) {
      const text = await res.text();
      console.error("Non-JSON response from NanoBanana:", text.substring(0, 500));
      return Response.json(
        { code: 502, message: "Upstream API returned invalid response." },
        { status: 502 }
      );
    }

    return Response.json(apiResponse, { status: res.status });

  } catch (error: any) {
    console.error("Error in /api/generate-pro:", error);

    if (error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return Response.json(
        { code: 504, message: "Timeout connecting to NanoBanana API. Check your network or proxy." },
        { status: 504 }
      );
    }

    if (error?.cause?.code?.includes('ECONNREFUSED') || error?.cause?.code?.includes('ENOTFOUND')) {
      return Response.json(
        { code: 502, message: "Could not connect to NanoBanana API. Check DNS or firewall." },
        { status: 502 }
      );
    }

    return Response.json(
      { code: 500, message: "Internal server error during image generation request." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";