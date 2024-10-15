import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

interface ImageGenerationResult {
  images?: Array<{ url: string }>;
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    console.log("Received request:", { prompt });

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: "A storyboard frame of a story about " + prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 2,
        enable_safety_checker: true,
        num_images: 1,
        seed: 42,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.forEach((log) => console.log(log.message));
        }
      },
    }) as ImageGenerationResult;

    console.log("API call result:", JSON.stringify(result, null, 2));

    const imageUrl = result.images?.[0]?.url;
    if (imageUrl) {
      return Response.json({ url: imageUrl });
    } else {
      console.error("Unexpected API response structure:", result);
      return Response.json({ error: "Unexpected API response structure" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in generateImage:", error);
    let errorMessage = "An unexpected error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

export const runtime = "edge";
