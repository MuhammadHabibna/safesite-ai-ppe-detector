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
        modelFile: 'ppe_yolo12s.onnx',
        labelsFile: 'ppe_classes.json',
        inputSize: 640,
        confThreshold: 0.25,
        iouThreshold: 0.45,
        description: 'Fine-tuned for PPE: Helmet, Vest, Person, Ear Protection.'
    },
    {
        id: 'yolo12s_coco',
        name: 'YOLOv12s COCO',
        type: 'coco',
        modelFile: 'yolo12s_coco.onnx',
        labelsFile: 'coco80.json',
        inputSize: 640,
        confThreshold: 0.25,
        iouThreshold: 0.45,
        description: 'Pretrained on COCO (80 classes).'
    }
];

export function getModelUrl(config: ModelConfig): string {
    return `${import.meta.env.BASE_URL}models/${config.modelFile}`;
}

export function getLabelsUrl(config: ModelConfig): string {
    return `${import.meta.env.BASE_URL}models/${config.labelsFile}`;
}
