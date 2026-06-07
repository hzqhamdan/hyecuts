"use client";
import { useEffect, useRef, useState, type ReactElement } from "react";

// Vertex shader source code
const vertexSmokeySource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

// Fragment shader source code for the smokey background effect
const fragmentSmokeySource = `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord / iResolution;
    vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    float time = iTime * 0.5;

    // Normalize mouse input (0.0 - 1.0) and remap to -1.0 ~ 1.0
    vec2 mouse = iMouse / iResolution;
    vec2 rippleCenter = 2.0 * mouse - 1.0;

    vec2 distortion = centeredUV;
    // Apply distortion for a wavy, smokey effect
    for (float i = 1.0; i < 8.0; i++) {
        distortion.x += 0.5 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
        distortion.y += 0.5 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
    }

    // Create a glowing wave pattern
    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.9, 0.2, wave);

    fragColor = vec4(u_color * glow, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

/**
 * Valid blur sizes supported by Tailwind CSS.
 */
type BlurSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

/**
 * Props for the SmokeyBackground component.
 */
interface SmokeyBackgroundProps {
  backdropBlurAmount?: string;
  color?: string;
  className?: string;
}

/**
 * A mapping from blur size names to Tailwind CSS classes.
 */
const blurClassMap: Record<BlurSize, string> = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
  "2xl": "backdrop-blur-2xl",
  "3xl": "backdrop-blur-3xl",
};

/**
 * A React component that renders an interactive WebGL shader background.
 */
export function SmokeyBackground({
  backdropBlurAmount = "sm",
  color = "#1E40AF", // Default dark blue
  className = "",
}: SmokeyBackgroundProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Helper to convert hex color to RGB (0-1 range)
  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;
    return [r, g, b];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Some browsers/GPUs refuse to create a WebGL context on a 0x0 canvas.
    // Defer context creation one frame so the layout has settled.
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    const init = () => {
      if (cancelled) return;
      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
        // Try again next frame until layout gives us real dimensions.
        requestAnimationFrame(init);
        return;
      }

      // Try WebGL 1 first (the shaders use GLSL ES 1.00: `attribute`, `gl_FragColor`).
      // Fall back to the legacy/experimental names some drivers still require.
      const gl =
        canvas.getContext("webgl", {
          antialias: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
        }) ??
        (canvas.getContext("experimental-webgl", {
          antialias: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
        }) as WebGLRenderingContext | null);
      if (!gl) {
        console.error(
          "WebGL not supported in this browser/GPU. " +
            "Try enabling hardware acceleration in your browser settings " +
            "(Edge: edge://settings/system → Use graphics acceleration when available).",
        );
        return;
      }

      const compileShader = (type: number, source: string): WebGLShader | null => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSmokeySource);
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSmokeySource);
      if (!vertexShader || !fragmentShader) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program linking error:", gl.getProgramInfoLog(program));
        return;
      }

      gl.useProgram(program);

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
      const iTimeLocation = gl.getUniformLocation(program, "iTime");
      const iMouseLocation = gl.getUniformLocation(program, "iMouse");
      const uColorLocation = gl.getUniformLocation(program, "u_color");

      const startTime = Date.now();
      const [r, g, b] = hexToRgb(color);
      gl.uniform3f(uColorLocation, r, g, b);

      let animationFrameId = 0;
      const render = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);

        const currentTime = (Date.now() - startTime) / 1000;

        gl.uniform2f(iResolutionLocation, width, height);
        gl.uniform1f(iTimeLocation, currentTime);
        gl.uniform2f(iMouseLocation, isHovering ? mousePosition.x : width / 2, isHovering ? height - mousePosition.y : height / 2);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationFrameId = requestAnimationFrame(render);
      };

      const handleMouseMove = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      };
      const handleMouseEnter = () => setIsHovering(true);
      const handleMouseLeave = () => setIsHovering(false);

      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseenter", handleMouseEnter);
      canvas.addEventListener("mouseleave", handleMouseLeave);

      // If the container resizes, the next render() will pick up the new size.
      const handleResize = () => { /* render() reads clientWidth/Height each frame */ };
      window.addEventListener("resize", handleResize);

      render();

      cleanup = () => {
        cancelAnimationFrame(animationFrameId);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseenter", handleMouseEnter);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        window.removeEventListener("resize", handleResize);
      };
    };

    init();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [isHovering, mousePosition, color]);

  const finalBlurClass = blurClassMap[backdropBlurAmount as BlurSize] || blurClassMap["sm"];

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      <div className={`absolute inset-0 ${finalBlurClass} pointer-events-none`}></div>
    </div>
  );
}
