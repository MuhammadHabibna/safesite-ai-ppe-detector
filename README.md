# SafeSite AI - Client-Side PPE Detection

A React + Vite application for real-time Personal Protective Equipment (PPE) detection running entirely in the browser using ONNX Runtime Web.

## Features
- **Client-Side Only:** No backend inference servers. Privacy-first.
- **Dual Models:** 
  - `PPE Detector` (Fine-tuned YOLOv12s): Detects Helmet, No Helmet, Vest, No Vest.
  - `COCO Detector` (YOLOv12s): Detects 80 general classes.
- **Optimized Performance:** Uses Single-Threaded WASM for broad compatibility (Cloudflare Pages, etc.).
- **Tools:** Webcam inference, Image upload, JSON/CSV export, Visual overlays.

## Setup Requirements

### 1. Model Assets (CRITICAL)
Place your ONNX models and JSON labels in `public/models/`:
- `public/models/ppe_yolo12s.onnx`
- `public/models/yolo12s_coco.onnx`
- `public/models/ppe_classes.json`
- `public/models/coco80.json`

> **Note:** The application will return 404 errors in the Debug panel if these files are missing.

### 2. ONNX Runtime Assets
We use a local copy of ONNX Runtime WebAssembly files for stability.
This is handled automatically by the `npm run copy-ort` script which runs before build.
Files are copied to `public/ort/`.

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Local run (development server)
npm run dev
```
Open http://localhost:5173

## Deployment (Cloudflare Pages)

1. **Build Command:** `npm ci && npm run build`
2. **Output Directory:** `dist`
3. **Environment:** No special headers required (Multi-threading is disabled by default for compatibility).

The `_redirects` file in `public/` ensures SPA routing works correctly.

## Debugging
If you encounter "Model not found" or "Session failed":
1. Go to `/debug` page.
2. Click "Check PPE model asset" to verify `.onnx` availability.
3. Click "Check ORT WASM asset" to verify WebAssembly loading.

## Architecture
- **Framework:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Inference:** `onnxruntime-web` (WASM backend)
- **State:** Local component state (no global store complexity)
- **Routing:** `react-router-dom` with `basename` support.

## Exporting Custom Models
To replace models, export your YOLOv8/v11/v12 model:
```bash
yolo export model=best.pt format=onnx imgsz=640 simplify opset=12
```
Rename and place in `public/models/`. Update `src/inference/models.ts` if filenames change.
