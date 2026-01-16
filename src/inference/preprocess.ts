import * as ort from 'onnxruntime-web';

export interface PreprocessResult {
    tensor: ort.Tensor;
    metadata: {
        originalWidth: number;
        originalHeight: number;
        scale: number;
        padLeft: number;
        padTop: number;
        inputSize: number;
    };
}

export function preprocess(
    image: HTMLImageElement | HTMLVideoElement,
    inputSize = 640
): PreprocessResult {
    const { videoWidth, videoHeight, naturalWidth, naturalHeight } = image as any;
    const w = videoWidth || naturalWidth;
    const h = videoHeight || naturalHeight;

    // Calculate scale and pads
    const scale = Math.min(inputSize / w, inputSize / h);
    const newW = Math.round(w * scale);
    const newH = Math.round(h * scale);
    const padLeft = Math.floor((inputSize - newW) / 2);
    const padTop = Math.floor((inputSize - newH) / 2);

    // Draw to canvas
    const canvas = document.createElement('canvas');
    canvas.width = inputSize;
    canvas.height = inputSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context failed');

    // Fill background with 114/255 (standard YOLO gray) or 0
    ctx.fillStyle = '#727272'; // 114,114,114
    ctx.fillRect(0, 0, inputSize, inputSize);

    ctx.drawImage(image, 0, 0, w, h, padLeft, padTop, newW, newH);

    const imageData = ctx.getImageData(0, 0, inputSize, inputSize);
    const { data } = imageData; // RGBA uint8

    // Convert to Float32 NCHW [1, 3, 640, 640]
    const float32Data = new Float32Array(3 * inputSize * inputSize);

    // Stride pointers
    const redOffset = 0;
    const greenOffset = inputSize * inputSize;
    const blueOffset = 2 * inputSize * inputSize;

    for (let i = 0; i < inputSize * inputSize; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];

        // Normalize 0-1
        float32Data[redOffset + i] = r / 255.0;
        float32Data[greenOffset + i] = g / 255.0;
        float32Data[blueOffset + i] = b / 255.0;
    }

    const tensor = new ort.Tensor('float32', float32Data, [1, 3, inputSize, inputSize]);

    return {
        tensor,
        metadata: {
            originalWidth: w,
            originalHeight: h,
            scale,
            padLeft,
            padTop,
            inputSize
        }
    };
}
