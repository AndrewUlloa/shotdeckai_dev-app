import * as fal from "@fal-ai/serverless-client";

interface Env {
  FAL_KEY: string
}

interface ImageGenerationResult {
  images?: Array<{ url: string }>;
}

export async function generateImage(prompt: string, env: Env): Promise<string> {
  // Configure FAL client with the API key
  fal.config({
    credentials: env.FAL_KEY,
  });

  try {
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
          ]
        }`,
        image_size: "landscape_4_3",
        num_inference_steps: 8,
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

    console.log("FAL API call result:", JSON.stringify(result, null, 2));

    const imageUrl = result.images?.[0]?.url;
    if (imageUrl) {
      return imageUrl;
    } else {
      console.error("Unexpected FAL API response structure:", result);
      throw new Error("Unexpected FAL API response structure");
    }
  } catch (error) {
    console.error("Error generating image with FAL:", error);
    throw error;
  }
} 