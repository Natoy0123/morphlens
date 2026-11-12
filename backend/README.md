# MorphLens Self-Hosted FLUX.1 Backend Guide

Run **FLUX.1 [schnell]** on a **free cloud GPU (Google Colab 15 GB Tesla T4)** and connect it directly to your MorphLens app via a private Cloudflare Tunnel.

---

## 1. Quick Start via Google Colab (Free 1-Click)

1. Open [Google Colab](https://colab.research.google.com).
2. Click **File** > **Upload Notebook** and select `backend/colab_flux_server.ipynb` from this repo (or create a new notebook).
3. In Colab, go to **Runtime** > **Change runtime type** and select **T4 GPU** (Hardware accelerator: GPU).
4. Run the notebook cells sequentially:
   - Cell 1 installs dependencies (`diffusers`, `torch`, `fastapi`, `uvicorn`, `pycloudflared`).
   - Cell 2 starts the server and prints a public Cloudflare tunnel link:
     ```
     ============================================================
     PUBLIC CLOUDFLARE TUNNEL URL: https://random-words.trycloudflare.com
     ============================================================
     ```
5. Copy that URL.
6. In **MorphLens**, open **Studio Adjustments** (or click the Key icon), switch the **Inference Engine** to **Self-Hosted**, paste your tunnel URL, and click **Connect**.

---

## 2. API Specifications

The server exposes standard endpoints:

### `GET /health`
Confirms the backend is online and reports GPU availability.
```json
{
  "status": "ok",
  "service": "MorphLens FLUX.1 Backend",
  "model": "black-forest-labs/FLUX.1-schnell",
  "device": "cuda",
  "ready": true
}
```

### `POST /generate`
Generates a portrait using FLUX.1 schnell in 4 steps.
- **Request Body**:
  ```json
  {
    "prompt": "Studio portrait, cinematic lighting, sharp eyes, 85mm lens",
    "width": 768,
    "height": 1024,
    "steps": 4,
    "seed": 42
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "image": "data:image/jpeg;base64,...",
    "model": "black-forest-labs/FLUX.1-schnell",
    "seed": 42,
    "width": 768,
    "height": 1024
  }
  ```

---

## 3. Running on a Dedicated Cloud Instance (RunPod / Vast.ai)

If you prefer an on-demand cloud server ($0.20/hour for an RTX 3090/4090):
```bash
git clone https://github.com/Natoy0123/morphlens.git
cd morphlens/backend
pip install -r requirements.txt
python server.py
```
The public Cloudflare Tunnel URL will print to the console automatically.
