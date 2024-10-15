import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    console.log("Received request:", { prompt });

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: "A storyboard frame of a story about " + prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 3,
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
    });

    console.log("API call successful:", result);

    if (result?.images?.[0]?.url) {
      return Response.json({ url: result.images[0].url });
    } else {
      throw new Error("Unexpected API response structure");
    }
  } catch (error) {
    console.error("Error in generateImage:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export const runtime = "edge";
