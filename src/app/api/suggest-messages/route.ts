import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Edge runtime is required for high-performance streaming
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = 
      "Create a list of three open-ended and engaging questions formatted as a single string. " +
      "Each question should be separated by '||'. Do not include numbers or bullet points. " +
      "Example: 'What’s a hobby you’ve recently started?||If you could have dinner with any historical figure, who would it be?||What’s a simple thing that makes you happy?'";

    const result = await model.generateContentStream(prompt);

    // Create a stream to pipe the AI response to the frontend
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate" }), { status: 500 });
  }
}



// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { NextResponse } from "next/server";

// // Initialize the API with your key
// const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// export const runtime = "edge";

// export async function POST(req: Request) {
//   try {
//     const prompt = "Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for an anonymous social messaging platform and should be suitable for a diverse audience. Avoid personal or sensitive topics. Example format: 'What’s a hobby you’ve recently started?||If you could have dinner with any historical figure, who would it be?||What’s a simple thing that makes you happy?'";

//     // Use the 2026 stable model
//     const model = genAI.getGenerativeModel({ 
//       model: "gemini-2.5-flash" 
//     });

//     const result = await model.generateContentStream(prompt);

//     // Create a native ReadableStream for the response
//     const stream = new ReadableStream({
//       async start(controller) {
//         try {
//           for await (const chunk of result.stream) {
//             const text = chunk.text();
//             controller.enqueue(new TextEncoder().encode(text));
//           }
//         } catch (err) {
//           controller.error(err);
//         } finally {
//           controller.close();
//         }
//       },
//     });

//     return new Response(stream, {
//       headers: { "Content-Type": "text/plain; charset=utf-8" },
//     });

//   } catch (error: any) {
//     console.error("Gemini API Error:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error", message: error?.message || "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }
