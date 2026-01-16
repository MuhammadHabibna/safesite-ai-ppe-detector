import * as ort from 'onnxruntime-web';
import type { ModelConfig } from './models';
import type { PreprocessResult } from './preprocess';

export interface Detection {
    classId: number;
    label: string;
    confidence: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

// IoU (Intersection over Union)
function iou(box1: Detection, box2: Detection): number {
    const x1 = Math.max(box1.x1, box2.x1);
    const y1 = Math.max(box1.y1, box2.y1);
    const x2 = Math.min(box1.x2, box2.x2);
    const y2 = Math.min(box1.y2, box2.y2);

    if (x2 < x1 || y2 < y1) return 0;

    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = (box1.x2 - box1.x1) * (box1.y2 - box1.y1);
    const area2 = (box2.x2 - box2.x1) * (box2.y2 - box2.y1);

    return intersection / (area1 + area2 - intersection);
}

export function postprocess(
    output: ort.Tensor,
    _frames: number, // not used directly but consistent with other APIs
    labels: string[],
    config: ModelConfig,
    meta: PreprocessResult['metadata']
): Detection[] {
    const data = output.data as Float32Array;
    const dims = output.dims; // e.g. [1, 84, 8400] or [1, 8400, 84]

    let rows = 0;
    let cols = 0;
    let transposed = false; // logic: if dims[1] > dims[2] (e.g. 8400 > 84), it's rows first? 
    // Standard YOLOv8 export: [1, 4+C, N] -> [1, 84, 8400]
    // We want to iterate N anchors (8400).
    // So cols = 84 (attributes), rows = 8400 (anchors).

    // If dims[1] is classes+4 (small), and dims[2] is anchors (large), then it's [C, N] format (need strict access)
    // If dims[1] large, dims[2] small, it is [N, C] format.

    if (dims[1] < dims[2]) {
        // [1, 84, 8400]
        cols = dims[1]; // 84
        rows = dims[2]; // 8400
        transposed = true; // Memory matches [col][row] effectively if we view it as matrix
    } else {
        // [1, 8400, 84]
        rows = dims[1];
        cols = dims[2];
        transposed = false;
    }

    const detections: Detection[] = [];
    const { confThreshold, iouThreshold } = config;

    for (let r = 0; r < rows; r++) {
        // Read box and scores
        let cx = 0, cy = 0, w = 0, h = 0;
        let maxScore = 0;
        let maxClassId = -1;

        // Helper to get value at row r, col c
        const getVal = (c: number) => {
            if (transposed) {
                // shape [1, cols, rows] -> stride = rows
                return data[c * rows + r];
            } else {
                // shape [N, C] -> stride = cols
                return data[r * cols + c];
            }
        };

        // First 4 are box
        cx = getVal(0);
        cy = getVal(1);
        w = getVal(2);
        h = getVal(3);

        // Remaining are classes
        for (let c = 4; c < cols; c++) {
            const score = getVal(c);
            if (score > maxScore) {
                maxScore = score;
                maxClassId = c - 4;
            }
        }

        if (maxScore >= confThreshold) {
            // Convert cx,cy,w,h to x1,y1,x2,y2
            let x1 = cx - w / 2;
            let y1 = cy - h / 2;
            let x2 = cx + w / 2;
            let y2 = cy + h / 2;

            // Unletterbox
            // (x - pad) / scale
            x1 = (x1 - meta.padLeft) / meta.scale;
            y1 = (y1 - meta.padTop) / meta.scale;
            x2 = (x2 - meta.padLeft) / meta.scale;
            y2 = (y2 - meta.padTop) / meta.scale;

            // Clip to image
            x1 = Math.max(0, x1);
            y1 = Math.max(0, y1);
            x2 = Math.min(meta.originalWidth, x2);
            y2 = Math.min(meta.originalHeight, y2);

            detections.push({
                classId: maxClassId,
                label: labels[maxClassId] || `Class ${maxClassId}`,
                confidence: maxScore,
                x1, y1, x2, y2
            });
        }
    }

    // NMS
    // Sort by confidence
    detections.sort((a, b) => b.confidence - a.confidence);

    const result: Detection[] = [];
    while (detections.length > 0) {
        const best = detections.shift()!;
        result.push(best);
        // Remove overlaps
        for (let i = detections.length - 1; i >= 0; i--) {
            if (iou(best, detections[i]) > iouThreshold) {
                detections.splice(i, 1);
            }
        }
    }

    return result;
}
