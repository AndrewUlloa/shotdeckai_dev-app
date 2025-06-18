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

    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: {
        prompt: `${prompt} {
          "style_name": "DigitalStoryboard_Teal",
          "medium": "digital sketch (tablet, pressure-sensitive pen)",
          "brush_stroke": "loose teal linework ≈2 pt, variable opacity, minimal cross-hatching",
          "edges": "crisp teal rectangular panel borders; internal arrows & notes in lighter teal",
          "color_palette": {
            "primary": ["#70A0A0", "#406C6C"],               // teal lines & borders
            "accents": ["#DF7425"],                           // orange emphasis (props / cues)
            "complementary": ["#E0E0E0", "#BDBDBD", "#FFFFFF"]// flat gray fills & paper white
          },
          "detail_level": "low-medium on characters & key props, very low on background",
          "background": "plain white (no texture)",
          "texture_overlay": "none (clean digital canvas)",
          "lighting": "flat fill with sparse gray shadow blocks",
          "ideal_subjects": [
            "dialogue two-shots",
            "dynamic action silhouettes",
            "prop hand-offs",
            "establishing wides"
          ],
          "file_format_hint": [
            "PNG (transparent or white background)",
            "PSD with separate line & fill layers"
          ],
          "example_prompt": [
            "Storyboard frame 14: low-angle close-up of Ki-woo tilting his head, teal sketch lines, flat gray shadows, orange highlight on his eyes, handwritten camera arrow indicating LOW ANGLE on the right margin",
            "Storyboard frame 17: medium shot, character hands a polished stone across a kitchen table, teal outlines, gray table & walls, single orange accent on the stone, arrow pointing PAN LEFT, quick handwritten note above"
          ]
        }`,
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
