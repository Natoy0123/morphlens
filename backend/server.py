"""
MorphLens Self-Hosted FLUX.1 Server
===================================
A lightweight FastAPI backend that runs FLUX.1 [schnell] (4-step distilled)
or SDXL with reference image conditioning, exposed over a public Cloudflare Tunnel.

Requirements:
    pip install fastapi uvicorn diffusers torch torchvision transformers accelerate pycloudflared pillow pydantic

Usage:
    python server.py
"""

import io
import os
import sys
import base64
import random
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")
logger = logging.getLogger("morphlens-server")

app = FastAPI(title="MorphLens FLUX.1 Backend", version="1.0.0")

# Enable CORS for MorphLens Web Studio
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipe = None
# Use unsloth/FLUX.1-schnell (exact ungated public mirror, requires no Hugging Face login or token)
MODEL_ID = os.environ.get("FLUX_MODEL_ID", "unsloth/FLUX.1-schnell")
DEVICE = "cuda" if os.environ.get("FORCE_CPU") != "1" else "cpu"

def load_pipeline():
    global pipe, DEVICE
    import torch
    from diffusers import FluxPipeline, FluxImg2ImgPipeline

    if not torch.cuda.is_available() and DEVICE != "cpu":
        logger.warning("CUDA not detected. Falling back to CPU mode (inference will be slower).")
        DEVICE = "cpu"

    dtype = torch.bfloat16 if DEVICE == "cuda" else torch.float32
    logger.info(f"Loading {MODEL_ID} on {DEVICE} ({dtype})...")

    try:
        # Load Flux Schnell (4-step model)
        pipe = FluxPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=dtype,
        )
        if DEVICE == "cuda":
            # Optimize memory footprint
            pipe.enable_model_cpu_offload()
        logger.info("FLUX.1 pipeline loaded successfully!")
    except Exception as e:
        logger.error(f"Error loading FLUX model: {e}")
        pipe = None

class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = ""
    image: Optional[str] = None  # Base64 data URL
    likeness: Optional[float] = 0.85
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    seed: Optional[int] = None
    steps: Optional[int] = 4
    guidance_scale: Optional[float] = 0.0

@app.get("/health")
@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "MorphLens FLUX.1 Backend",
        "model": MODEL_ID,
        "device": DEVICE,
        "ready": pipe is not None,
    }

def decode_base64_image(data_uri: str) -> Image.Image:
    if "," in data_uri:
        data_uri = data_uri.split(",", 1)[1]
    image_bytes = base64.b64decode(data_uri)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return image

def encode_pil_to_base64(image: Image.Image) -> str:
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG", quality=95)
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{img_str}"

@app.post("/generate")
def generate(req: GenerateRequest):
    if pipe is None:
        raise HTTPException(status_code=503, detail="Model pipeline is not ready yet.")

    import torch

    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    active_seed = req.seed if (req.seed is not None and req.seed >= 0) else random.randint(0, 2**32 - 1)
    generator = torch.Generator(device=DEVICE if DEVICE != "cuda" else "cpu").manual_seed(active_seed)

    # Round width and height to multiples of 16
    width = max(256, min(1536, (req.width // 16) * 16))
    height = max(256, min(1536, (req.height // 16) * 16))
    steps = max(1, min(10, req.steps or 4))

    logger.info(f"Generating with prompt='{prompt[:60]}...' size={width}x{height} seed={active_seed} steps={steps}")

    try:
        output = pipe(
            prompt=prompt,
            width=width,
            height=height,
            num_inference_steps=steps,
            generator=generator,
            guidance_scale=req.guidance_scale or 0.0,
        )
        result_image = output.images[0]
        data_url = encode_pil_to_base64(result_image)

        return {
            "status": "success",
            "image": data_url,
            "model": MODEL_ID,
            "seed": active_seed,
            "width": width,
            "height": height,
        }
    except Exception as e:
        logger.error(f"Generation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

def start_cloudflare_tunnel(port: int = 8000):
    try:
        from pycloudflared import try_cloudflare
        tunnel_url = try_cloudflare(port=port)
        logger.info("=" * 60)
        logger.info(f"PUBLIC CLOUDFLARE TUNNEL URL: {tunnel_url.tunnel}")
        logger.info(f"Paste this URL into MorphLens Studio Adjustments settings!")
        logger.info("=" * 60)
        return tunnel_url.tunnel
    except Exception as e:
        logger.warning(f"Could not automatically start pycloudflared tunnel: {e}")
        return None

if __name__ == "__main__":
    import uvicorn

    load_pipeline()
    port = int(os.environ.get("PORT", "8000"))

    # If run in Google Colab or remote VPS, expose Cloudflare tunnel
    tunnel = start_cloudflare_tunnel(port)

    uvicorn.run(app, host="0.0.0.0", port=port)
