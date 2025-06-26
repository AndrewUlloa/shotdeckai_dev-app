export function homepage(): Response {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ShotDeckAI - Placeholder Zoo</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 2rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #ffffff;
            text-align: center;
            margin-bottom: 1rem;
            font-size: 2.5rem;
          }
          .subtitle {
            text-align: center;
            margin-bottom: 2rem;
            opacity: 0.9;
          }
          .examples {
            display: grid;
            gap: 1rem;
            margin: 2rem 0;
          }
          .example {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;
            transition: all 0.3s ease;
          }
          .example:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
          }
          .example a {
            color: #ffffff;
            text-decoration: none;
            display: block;
            font-weight: 500;
          }
          .example a:hover {
            text-decoration: underline;
          }
          .description {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-top: 0.5rem;
          }
          .features {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
          }
          .feature {
            margin-bottom: 1rem;
            padding-left: 1.5rem;
            position: relative;
          }
          .feature::before {
            content: "✨";
            position: absolute;
            left: 0;
          }
          code {
            background: rgba(0, 0, 0, 0.3);
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: Monaco, Consolas, monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎬 ShotDeckAI Placeholder Zoo</h1>
          <p class="subtitle">AI-generated placeholder images with storyboard styling</p>
          
          <h2>🎯 Quick Examples</h2>
          <div class="examples">
            <div class="example">
              <a href="/800x600/sunglasses-sloth">/800x600/sunglasses-sloth</a>
              <div class="description">A cool sloth wearing sunglasses in 800x600 format</div>
            </div>
            <div class="example">
              <a href="/512x512/psychic-goat">/512x512/psychic-goat</a>
              <div class="description">A mystical goat with psychic powers in square format</div>
            </div>
            <div class="example">
              <a href="/1024x768/hippie-lion">/1024x768/hippie-lion</a>
              <div class="description">A groovy lion with hippie vibes in landscape format</div>
            </div>
            <div class="example">
              <a href="/600x800/punk-giraffe">/600x800/punk-giraffe</a>
              <div class="description">A rebellious giraffe with punk rock style in portrait format</div>
            </div>
            <div class="example">
              <a href="/400x300/ninja-penguin">/400x300/ninja-penguin</a>
              <div class="description">A stealthy penguin with ninja skills in small format</div>
            </div>
          </div>

          <div class="features">
            <h2>🚀 Features</h2>
            <div class="feature">Generates images using FAL AI's Flux model</div>
            <div class="feature">Caches images in Cloudflare Images for persistence</div>
            <div class="feature">Dynamic resizing and transformations</div>
            <div class="feature">Storyboard-style aesthetic with teal linework</div>
            <div class="feature">Fast response times with intelligent caching</div>
          </div>

          <h2>📝 Usage</h2>
          <p>Use the format: <code>/WIDTHxHEIGHT/animal-description</code></p>
          <p>Add <code>?redo</code> to bypass cache and generate a new image.</p>
          
          <p style="text-align: center; margin-top: 2rem; opacity: 0.8;">
            Powered by <strong>ShotDeckAI</strong> • <strong>FAL AI</strong> • <strong>Cloudflare</strong>
          </p>
        </div>
      </body>
    </html>
  `;
  
  return new Response(html, { 
    status: 200,
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600' // Cache homepage for 1 hour
    }
  });
} 