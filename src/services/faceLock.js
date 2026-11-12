/**
 * Face-Locked Synthesis & Compositing Engine.
 *
 * Ensures the user's authentic facial identity, eyes, nose, mouth,
 * skin tone, and facial contours are preserved without being trashed
 * or replaced with generic AI faces.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Estimate or detect face bounding box
 */
async function locateFace(img, framingMode = 'headshot') {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  // Try Native Shape Detection API if available in Chromium
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      // @ts-ignore
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(img);
      if (faces && faces.length > 0) {
        const box = faces[0].boundingBox;
        return {
          cx: box.x + box.width / 2,
          cy: box.y + box.height / 2,
          rx: box.width * 0.58,
          ry: box.height * 0.72,
          box,
        };
      }
    } catch {
      // Fallback to geometric heuristic
    }
  }

  // Framing-based anatomical facial positioning
  let cxRatio = 0.5;
  let cyRatio = 0.42;
  let rxRatio = 0.23;
  let ryRatio = 0.29;

  if (framingMode === 'half_body') {
    cyRatio = 0.28;
    rxRatio = 0.17;
    ryRatio = 0.22;
  } else if (framingMode === 'full_body') {
    cyRatio = 0.16;
    rxRatio = 0.11;
    ryRatio = 0.15;
  } else if (framingMode === 'auto') {
    cyRatio = 0.24;
    rxRatio = 0.15;
    ryRatio = 0.20;
  }

  return {
    cx: w * cxRatio,
    cy: h * cyRatio,
    rx: w * rxRatio,
    ry: h * ryRatio,
  };
}

/**
 * Blends the original authentic face onto the stylized generated image
 * with soft radial feathering to eliminate seams and preserve facial landmarks.
 *
 * @param {object} options
 * @param {string} options.originalImageUrl Source photo with real face
 * @param {string} options.generatedImageUrl Synthesized costume/scene image
 * @param {'headshot'|'half_body'|'full_body'|'auto'} [options.framingMode]
 * @param {number} [options.likeness] 0..1 blend fidelity
 * @returns {Promise<string>} Blob URL of the composite portrait
 */
export async function compositeFaceLock({
  originalImageUrl,
  generatedImageUrl,
  framingMode = 'headshot',
  likeness = 0.85,
}) {
  if (typeof document === 'undefined') {
    return generatedImageUrl;
  }

  if (!originalImageUrl || !generatedImageUrl || likeness <= 0.3) {
    return generatedImageUrl;
  }

  try {
    const [origImg, genImg] = await Promise.all([
      loadImage(originalImageUrl),
      loadImage(generatedImageUrl),
    ]);

    const targetWidth = genImg.naturalWidth || genImg.width || 1024;
    const targetHeight = genImg.naturalHeight || genImg.height || 1024;

    const [origFace, genFace] = await Promise.all([
      locateFace(origImg, framingMode),
      locateFace(genImg, framingMode),
    ]);

    // Canvas to hold the composite
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return generatedImageUrl;

    // 1. Draw base generated attire and scene
    ctx.drawImage(genImg, 0, 0, targetWidth, targetHeight);

    // 2. Prepare the feathered face mask
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = targetWidth;
    faceCanvas.height = targetHeight;
    const fCtx = faceCanvas.getContext('2d');
    if (!fCtx) return generatedImageUrl;

    // Compute transformation to align original face to generated face position & scale
    const scaleX = genFace.rx / (origFace.rx || 1);
    const scaleY = genFace.ry / (origFace.ry || 1);
    const avgScale = (scaleX + scaleY) / 2;

    fCtx.save();

    // Create an elliptical feather mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = targetWidth;
    maskCanvas.height = targetHeight;
    const mCtx = maskCanvas.getContext('2d');
    if (mCtx) {
      const grad = mCtx.createRadialGradient(
        genFace.cx,
        genFace.cy,
        Math.min(genFace.rx, genFace.ry) * 0.35,
        genFace.cx,
        genFace.cy,
        Math.min(genFace.rx, genFace.ry) * 0.85
      );
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      mCtx.save();
      mCtx.translate(genFace.cx, genFace.cy);
      mCtx.scale(1, (genFace.ry * 0.9) / (genFace.rx || 1));
      mCtx.translate(-genFace.cx, -genFace.cy);

      mCtx.fillStyle = grad;
      mCtx.beginPath();
      mCtx.arc(genFace.cx, genFace.cy, genFace.rx * 0.85, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.restore();
    }

    // Draw transformed original face onto faceCanvas
    fCtx.translate(genFace.cx, genFace.cy);
    fCtx.scale(avgScale, avgScale);
    fCtx.translate(-origFace.cx, -origFace.cy);
    fCtx.drawImage(origImg, 0, 0);
    fCtx.restore();

    // Apply the feathered mask to the original face
    fCtx.globalCompositeOperation = 'destination-in';
    fCtx.drawImage(maskCanvas, 0, 0);

    // 3. Composite feathered authentic face over the generated image
    // Blend strength scaled by user's likeness slider (e.g. 0.85 -> natural seamless blend)
    ctx.save();
    ctx.globalAlpha = Math.min(1, likeness);
    ctx.drawImage(faceCanvas, 0, 0);
    ctx.restore();

    // Export as high-quality JPEG blob URL
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.94);
    });

    if (blob) {
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.warn('Face-locked composite fallback:', err);
  }

  return generatedImageUrl;
}
