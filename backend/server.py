"""
MorphLens Self-Hosted FLUX.1 Server (GGUF Q4 + Diffusers)
=========================================================
Runs FLUX.1 [schnell] or [dev] quantized with GGUF Q4 (~6.5 GB VRAM)
on consumer and free-tier cloud GPUs (e.g. Google Colab Tesla T4 15GB).
Supports both Text-to-Image and Image-to-Image (identity/reference editing).

Requirements:
    pip install fastapi uvicorn diffusers transformers accelerate sentencepiece protobuf gguf pycloudflared pillow pydantic

Usage:
    python server.py
"""

import io
import os
import sys
import base64
import random
import logging
import traceback
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")
logger = logging.getLogger("morphlens-server")

app = FastAPI(title="MorphLens FLUX.1 GGUF Backend", version="1.2.0")

# Enable comprehensive CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"},
    )

pipe = None
img2img_pipe = None
load_error = None
MODEL_ID = "FLUX.1-schnell-GGUF-Q4"
DEVICE = "cuda" if os.environ.get("FORCE_CPU") != "1" else "cpu"

def load_pipeline():
    global pipe, img2img_pipe, DEVICE, load_error
    import torch

    # Ensure gguf is available
    try:
        import gguf
    except ImportError:
        logger.info("gguf package not found. Installing automatically...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "gguf>=0.10.0"])
        import gguf

    from diffusers import FluxPipeline, FluxTransformer2DModel, GGUFQuantizationConfig

    if not torch.cuda.is_available() and DEVICE != "cpu":
        logger.warning("CUDA not detected. Falling back to CPU mode.")
        DEVICE = "cpu"

    dtype = torch.float16 if DEVICE == "cuda" else torch.float32
    logger.info(f"Loading FLUX.1 Schnell GGUF Q4 on {DEVICE} ({dtype})...")

    try:
        # Load 6.5 GB GGUF Q4 transformer (fits safely in T4 15GB VRAM)
        transformer = FluxTransformer2DModel.from_single_file(
            "https://huggingface.co/city96/FLUX.1-schnell-gguf/blob/main/flux1-schnell-Q4_K_S.gguf",
            quantization_config=GGUFQuantizationConfig(compute_dtype=dtype),
            torch_dtype=dtype,
        )

        logger.info("Assembling pipeline from unsloth/FLUX.1-schnell...")
        pipe = FluxPipeline.from_pretrained(
            "unsloth/FLUX.1-schnell",
            transformer=transformer,
            torch_dtype=dtype,
        )

        try:
            from diffusers import FluxImg2ImgPipeline
            # Share pipeline components for zero-copy img2img support BEFORE offload hooks
            img2img_pipe = FluxImg2ImgPipeline(**pipe.components)
            logger.info("FluxImg2ImgPipeline created successfully.")
        except Exception as img_err:
            logger.warning(f"Img2Img pipeline initialization skipped: {img_err}")
            img2img_pipe = None

        if DEVICE == "cuda":
            pipe.enable_model_cpu_offload()
            if img2img_pipe is not None:
                try:
                    img2img_pipe.enable_model_cpu_offload()
                except Exception:
                    pass

        load_error = None
        logger.info("FLUX.1 GGUF Q4 pipeline loaded successfully and ready for inference!")
    except Exception as e:
        load_error = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        logger.error(f"Error loading FLUX GGUF model: {load_error}")
        pipe = None
        img2img_pipe = None

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
        "has_img2img": img2img_pipe is not None,
        "error": load_error,
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
        raise HTTPException(
            status_code=503,
            detail=f"Model pipeline is not ready yet. Error: {load_error or 'Initializing...'}"
        )

    import torch

    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    active_seed = req.seed if (req.seed is not None and req.seed >= 0) else random.randint(0, 2**32 - 1)
    generator = torch.Generator(device="cpu").manual_seed(active_seed)

    # Snap dimensions to multiples of 16
    width = max(256, min(1536, ((req.width or 1024) // 16) * 16))
    height = max(256, min(1536, ((req.height or 1024) // 16) * 16))
    steps = max(1, min(12, req.steps or 4))

    logger.info(f"Generating prompt='{prompt[:60]}...' size={width}x{height} seed={active_seed} steps={steps} has_image={bool(req.image)}")

    try:
        if req.image and img2img_pipe is not None:
            # Image-to-image / Subject editing flow
            init_image = decode_base64_image(req.image)
            init_image = init_image.resize((width, height), Image.Resampling.LANCZOS)
            
            likeness_val = max(0.1, min(1.0, req.likeness or 0.85))
            strength = max(0.40, min(0.85, 1.15 - (likeness_val * 0.6)))

            output = img2img_pipe(
                prompt=prompt,
                image=init_image,
                strength=strength,
                num_inference_steps=steps,
                generator=generator,
                guidance_scale=req.guidance_scale or 0.0,
            )
        else:
            # Text-to-image synthesis
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

if __name__ == "__main__":
    os.system("fuser -k 8000/tcp 2>/dev/null")
    load_pipeline()
    port = int(os.environ.get("PORT", 8000))

    try:
        from pycloudflared import try_cloudflare
        tunnel_url = try_cloudflare(port=port)
        print("\n" + "=" * 60)
        print("COPY THIS TUNNEL URL INTO MORPHLENS:")
        print(tunnel_url.tunnel)
        print("=" * 60 + "\n")
    except Exception as e:
        logger.warning(f"Could not initialize Cloudflare tunnel: {e}")

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
