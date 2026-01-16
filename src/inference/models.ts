export interface ModelConfig {
    id: string;
    name: string;
    type: 'ppe' | 'coco';
    modelFile: string;
    labelsFile: string;
    inputSize: number;
    confThreshold: number;
    iouThreshold: number;
    description: string;
}

export const MODELS: ModelConfig[] = [
    {
        id: 'ppe_yolo12s',
        name: 'PPE Detector (YOLOv12s)',
        type: 'ppe',
        modelFile: "https://muhammadhabibna.github.io/safesite-ai-ppe-detector/models/ppe_yolo12s.onnx",
        labelsFile: 'ppe_classes.json',
        inputSize: 640,
        confThreshold: 0.25,
        iouThreshold: 0.45,
        description: 'Fine-tuned for PPE compliance: helmet, no_helmet, vest, no_vest.'
    },
    {
        id: 'yolo12s_coco',
        name: 'YOLOv12s COCO',
        type: 'coco',
        modelFile: "https://muhammadhabibna.github.io/safesite-ai-ppe-detector/models/yolo12s_coco.onnx",
        labelsFile: 'coco80.json',
        inputSize: 640,
        confThreshold: 0.25,
        iouThreshold: 0.45,
        description: 'Pretrained on COCO (80 classes).'
    }
];

export function getModelUrl(config: ModelConfig): string {
    const file = config.modelFile;

    // If already an absolute URL (GitHub Releases, etc), return as-is
    if (/^https?:\/\//i.test(file)) return file;

    // Otherwise treat as local file in public/models
    const base = import.meta.env.BASE_URL.endsWith("/")
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;

    return `${base}models/${file.replace(/^\/+/, "")}`;
}

export function getLabelsUrl(config: ModelConfig): string {
    const file = config.labelsFile;

    if (/^https?:\/\//i.test(file)) return file;

    const base = import.meta.env.BASE_URL.endsWith("/")
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;

    return `${base}models/${file.replace(/^\/+/, "")}`;
}

