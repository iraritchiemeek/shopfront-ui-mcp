/**
 * MCP Apps render tool — three.js scene widget.
 *
 * render_three_scene accepts a JS function body from the model and executes it
 * inside the widget iframe via `new Function(...)`. This "code-as-argument"
 * idiom mirrors the codemode pattern used elsewhere in this repo and gives the
 * model unbounded creative range (custom BufferGeometry, parametric surfaces,
 * shaders) rather than constraining it to a small set of primitives.
 *
 * Design note: the tool description is kept short and example-led. Scene-level
 * config (background, camera, autoRotate, lights) is exposed as structured
 * params so the model can declare intent upfront instead of re-deriving camera
 * positions and backgrounds inside the code string. Per Anthropic's tool-use
 * guidance, prescriptive rules in the description encourage the model to fight
 * the tool; declarative params + examples let it steer.
 */
import { registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { THREE_SCENE_URI } from "../widgets/registry.js";
import { buildAppStubHtml } from "../widgets/stub.js";

export interface ThreeToolsContext {
  /** Base URL where Static Assets are served — used to reference widget JS/CSS. */
  getAssetsBaseUrl: () => string;
}

export function registerThreeTools(server: McpServer, context: ThreeToolsContext): void {
  // Note: executing model-supplied code via `new Function(...)` inside the
  // widget requires the host iframe to permit `unsafe-eval`. The MCP Apps CSP
  // schema (connect/resource/frame/baseUri domains) does not expose a direct
  // knob for this, so enforcement depends on the host's iframe CSP. If a host
  // denies eval, swap this widget to a declarative scene-graph input.
  server.registerResource(
    "three-scene",
    THREE_SCENE_URI,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: "Three.js scene rendered inline in chat.",
    },
    async (uri) => {
      const baseUrl = context.getAssetsBaseUrl();
      const html = buildAppStubHtml("three-scene", baseUrl);
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  resourceDomains: [baseUrl],
                },
                sandbox: {},
                openLinks: {},
              },
            },
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "render_three_scene",
    {
      description:
        "Render a three.js scene inline in chat.\n\n" +
        "The iframe pre-creates a Scene, PerspectiveCamera, WebGLRenderer (ACES Filmic, " +
        "antialias), a 5-light rig tuned for r155+ physically-correct lighting, a " +
        "ResizeObserver, a rAF loop, and automatic disposal on unmount. Your `code` runs " +
        "as `(THREE, scene, camera, renderer) => void | { tick?(dt), dispose?() }` — add " +
        "meshes to `scene`, install `tick(dt)` for animation (dt in seconds, clamped to " +
        "0.1), return `dispose()` for resources the default scene-traversal disposer won't " +
        "catch. Browser iframe only — no Node APIs, no window.innerWidth.\n\n" +
        "Configure the stage via the structured params (background, cameraPosition, " +
        "cameraLookAt, cameraFov, autoRotate*, clearLights) rather than boilerplate in " +
        "code. `scene`, `camera`, and `renderer` are live refs, so anything not covered " +
        "by params is still reachable from code.\n\n" +
        "The defaults target PBR objects near the origin in roughly [-3, 3] with hex " +
        "colors like 0xef4444 / 0x38bdf8. For particles, additive blending, shaders, " +
        "large-scale attractors, or dark scenes: set `background`, `clearLights: true`, " +
        "move the camera, and pick materials that fit (MeshBasicMaterial for unlit, " +
        "MeshPhongMaterial for cheap shiny, PointsMaterial for particles). Common mistake: " +
        "MeshStandardMaterial with metalness > 0.7 and no env map renders black.\n\n" +
        "Example — simple cube (defaults are fine):\n" +
        '  { code: "scene.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1), ' +
        'new THREE.MeshStandardMaterial({ color: 0x38bdf8 })))" }\n\n' +
        "Example — Lorenz attractor (large scale, dark bg, custom rotation axis):\n" +
        '  { background: "#000000", cameraPosition: [0, -90, 25], cameraLookAt: [0, 0, 25], ' +
        'clearLights: true, autoRotateAxis: "z", autoRotateSpeed: 0.15, ' +
        'code: "/* build THREE.Points with AdditiveBlending, advance Lorenz ODE in tick(dt) */" }',
      inputSchema: {
        title: z.string().optional().describe("Optional heading displayed above the canvas."),
        code: z
          .string()
          .min(1)
          .describe(
            "JS function body: `(THREE, scene, camera, renderer) => void | " +
              "{ tick?(dt), dispose?() }`. `THREE` is the full three.js namespace (0.184+). " +
              "`scene`, `camera`, and `renderer` are live references; the iframe auto-sizes " +
              "via ResizeObserver (do not read window dimensions). Shaders, custom " +
              "BufferGeometry, Points, Lines, Groups, InstancedMesh all supported.",
          ),
        background: z
          .string()
          .optional()
          .describe(
            "Scene background as a CSS color string ('#000000', 'black', 'hsl(220,20%,95%)'). " +
              "Default: '#f5f5f4' (light grey). Use a dark color for particle/additive scenes.",
          ),
        cameraPosition: z
          .tuple([z.number(), z.number(), z.number()])
          .optional()
          .describe(
            "Camera [x, y, z]. Default: [0, 0, 5]. Pull the camera back for large-scale " +
              "scenes (Lorenz attractors, orbital systems). The view is not auto-framed.",
          ),
        cameraLookAt: z
          .tuple([z.number(), z.number(), z.number()])
          .optional()
          .describe("Point the camera looks at, [x, y, z]. Default: [0, 0, 0]."),
        cameraFov: z
          .number()
          .optional()
          .describe("Perspective camera vertical FOV in degrees. Default: 50."),
        autoRotate: z
          .boolean()
          .optional()
          .describe(
            "If true (default), the scene auto-rotates. Set false when you drive rotation " +
              "in tick(dt) or when the scene is meant to be static.",
          ),
        autoRotateAxis: z
          .enum(["x", "y", "z"])
          .optional()
          .describe(
            "Axis for auto-rotation. Default: 'y'. Pick 'z' for scenes where the z-axis is up " +
              "(e.g. Lorenz attractors — y-rotation would tilt the butterfly awkwardly).",
          ),
        autoRotateSpeed: z
          .number()
          .optional()
          .describe("Auto-rotation speed in radians/second. Default: 0.4."),
        clearLights: z
          .boolean()
          .optional()
          .describe(
            "If true, skip the default 5-light rig. Use for particles, additive blending, " +
              "unlit materials (MeshBasicMaterial, PointsMaterial), or when you add your own " +
              "lighting setup.",
          ),
      },
      _meta: {
        ui: { resourceUri: THREE_SCENE_URI },
      },
    },
    async ({
      title,
      code,
      background,
      cameraPosition,
      cameraLookAt,
      cameraFov,
      autoRotate,
      autoRotateAxis,
      autoRotateSpeed,
      clearLights,
    }) => {
      return {
        content: [{ type: "text" as const, text: "Three.js scene rendered." }],
        structuredContent: {
          title,
          code,
          background,
          cameraPosition,
          cameraLookAt,
          cameraFov,
          autoRotate: autoRotate ?? true,
          autoRotateAxis,
          autoRotateSpeed,
          clearLights,
        } as unknown as Record<string, unknown>,
      };
    },
  );
}
