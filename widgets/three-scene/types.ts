export type Payload = {
  title?: string;
  code: string;
  autoRotate?: boolean;
  autoRotateAxis?: "x" | "y" | "z";
  autoRotateSpeed?: number;
  background?: string;
  cameraPosition?: [number, number, number];
  cameraLookAt?: [number, number, number];
  cameraFov?: number;
  clearLights?: boolean;
};

export type SceneHandle = {
  tick?: (dt: number) => void;
  dispose?: () => void;
};
