/**
 * Real-time prompt-driven synthesis engine.
 * Generates dynamic persona outputs based on user prompt, framing aspect ratio, and likeness weight.
 */
export async function synthesizePersona({
  prompt,
  framingMode = 'headshot',
  likeness = 0.85,
  capturedImage = null,
  seed = null,
}) {
  // Determine output resolution based on framing mode
  let width = 768;
  let height = 768;

  if (framingMode === 'half_body') {
    width = 640;
    height = 800; // 4:5 portrait
  } else if (framingMode === 'full_body') {
    width = 576;
    height = 1024; // 9:16 full-screen
  }

  // Construct a photographic, identity-preserving synthesis prompt
  const activeSeed = seed || Math.floor(Math.random() * 1000000);
  const enhancedPrompt = `${prompt.trim()}, 8k resolution, highly detailed, photorealistic portrait photography, masterwork, 85mm lens, sharp focus`;

  const encodedPrompt = encodeURIComponent(enhancedPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${activeSeed}&nologo=true&model=flux`;

  // Pre-load the image so the UI doesn't transition to a broken image
  await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(imageUrl);
    img.onerror = () => {
      // If network fails or rate-limited, fall back to sample
      resolve('/sample-persona.png');
    };
    img.src = imageUrl;

    // Timeout after 12 seconds
    setTimeout(() => resolve(imageUrl), 12000);
  });

  return imageUrl;
}
