'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from "next/image";

interface WebGLStoryboardFrameProps {
  imageUrls: string[];
  isLoading?: boolean;
}

// Vertex shader for the diffuse effect (from JSON)
const effectVertexShader = `#version 300 es
precision mediump float;
in vec3 aVertexPosition; 
in vec2 aTextureCoord;
uniform mat4 uMVMatrix; 
uniform mat4 uPMatrix; 
uniform mat4 uTextureMatrix;
out vec2 vTextureCoord;
void main() { 
  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); 
  vTextureCoord = (uTextureMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy; 
}`;

// Fragment shader for the diffuse effect (from JSON)
const effectFragmentShader = `#version 300 es
precision highp float; 
precision highp int;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uAmount; 
uniform float uTime; 
uniform vec2 uMousePos; 
uniform vec2 uResolution;

uint fibonacciHash(uint x) { 
  const uint FIB_HASH = 2654435769u; 
  uint hash = x * FIB_HASH; 
  hash ^= hash >> 16; 
  hash *= 0x85ebca6bu; 
  hash ^= hash >> 13; 
  hash *= 0xc2b2ae35u; 
  hash ^= hash >> 16; 
  return hash; 
}

float randFibo(vec2 xy) { 
  uint x_bits = floatBitsToUint(xy.x); 
  uint y_bits = floatBitsToUint(xy.y); 
  uint y_hash = fibonacciHash(y_bits); 
  uint x_xor_y = x_bits ^ y_hash; 
  uint final_hash = fibonacciHash(x_xor_y); 
  return float(final_hash) / float(0xffffffffu); 
}

const float MAX_ITERATIONS = 24.; 
out vec4 fragColor;

void main() { 
  vec2 uv = vTextureCoord; 
  vec2 pos = vec2(0.5068630139784036, 0.5098814563681826) + mix(vec2(0), (uMousePos-0.5), 0.0000); 
  float aspectRatio = uResolution.x/uResolution.y; 
  float delta = fract(floor(uTime)/20.); 
  float amount = uAmount * 2.;
  vec2 mPos = vec2(0.5068630139784036, 0.5098814563681826) + mix(vec2(0), (uMousePos-0.5), 0.0000); 
  pos = vec2(0.5068630139784036, 0.5098814563681826); 
  float dist = max(0.,1.-distance(uv * vec2(aspectRatio, 1), mPos * vec2(aspectRatio, 1)) * 4. * (1. - 1.0000));
  amount *= dist;
  vec4 col; 
  if(amount <= 0.001) { 
    col = texture(uTexture, uv); 
  } else { 
    vec4 result = vec4(0); 
    float threshold = max(1. - 0.0000, 2./MAX_ITERATIONS); 
    const float invMaxIterations = 1.0 / float(MAX_ITERATIONS);
    vec2 dir = vec2(0.5000 / aspectRatio, 1.-0.5000) * amount * 0.4; 
    float iterations = 0.0; 
    for(float i = 1.; i <= MAX_ITERATIONS; i++) { 
      float th = i * invMaxIterations; 
      if(th > threshold) break;
      float random1 = randFibo(uv + th + delta); 
      float random2 = randFibo(uv + th * 2. + delta); 
      float random3 = randFibo(uv + th * 3. + delta); 
      vec2 ranPoint = vec2(random1 * 2. - 1., random2 * 2. - 1.) * mix(1., random3, 0.8); 
      result += texture(uTexture, uv + ranPoint * dir); 
      iterations += 1.0; 
    }
    result /= max(1.0, iterations); 
    col = result; 
  } 
  fragColor = col;
}`;

export function WebGLStoryboardFrame({ imageUrls, isLoading = false }: WebGLStoryboardFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [glInitialized, setGlInitialized] = useState(false);

  // Handle image URL changes
  useEffect(() => {
    if (imageUrls.length > 0) {
      const newImageUrl = imageUrls[imageUrls.length - 1];
      
      if (displayedImageUrl && displayedImageUrl !== newImageUrl) {
        setIsFadingOut(true);
        setTimeout(() => {
          setDisplayedImageUrl(newImageUrl);
          setImageLoading(true);
          setIsFadingOut(false);
        }, 300);
      } else {
        setDisplayedImageUrl(newImageUrl);
        setImageLoading(true);
      }
    }
  }, [imageUrls, displayedImageUrl]);

  // Create shader helper
  const createShader = useCallback((gl: WebGL2RenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }, []);

  // Create program helper
  const createProgram = useCallback((gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }, []);

  // Initialize WebGL
  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL2 not supported');
      return false;
    }

    glRef.current = gl;

    // Create shader program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, effectVertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, effectFragmentShader);
    
    if (!vertexShader || !fragmentShader) return false;

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return false;

    programRef.current = program;

    // Set up geometry (full screen quad)
    const positions = new Float32Array([
      -1, -1, 0,
       1, -1, 0,
      -1,  1, 0,
       1,  1, 0,
    ]);

    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    // Set up vertex array object
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Set up attributes
    const positionLocation = gl.getAttribLocation(program, 'aVertexPosition');
    const texCoordLocation = gl.getAttribLocation(program, 'aTextureCoord');

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    setGlInitialized(true);
    return true;
  }, [createShader, createProgram]);

  // Load image as texture
  const loadImageTexture = useCallback((imageUrl: string) => {
    const gl = glRef.current;
    if (!gl) return;

    const img = new globalThis.Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      
      textureRef.current = texture;
      setImageLoading(false);
    };

    img.onerror = () => {
      console.error('Failed to load image:', imageUrl);
      setImageLoading(false);
    };

    img.src = imageUrl;
  }, []);

  // Render loop
  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const texture = textureRef.current;
    const canvas = canvasRef.current;

    if (!gl || !program || !texture || !canvas) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }

    // Update time
    timeRef.current += 0.016; // ~60fps

    // Set viewport
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use program
    gl.useProgram(program);

    // Set uniforms
    const timeLocation = gl.getUniformLocation(program, 'uTime');
    const amountLocation = gl.getUniformLocation(program, 'uAmount');
    const mousePosLocation = gl.getUniformLocation(program, 'uMousePos');
    const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
    const textureLocation = gl.getUniformLocation(program, 'uTexture');

    if (timeLocation) gl.uniform1f(timeLocation, timeRef.current);
    if (amountLocation) gl.uniform1f(amountLocation, 0.13); // From JSON
    if (mousePosLocation) gl.uniform2f(mousePosLocation, mouseRef.current.x, mouseRef.current.y);
    if (resolutionLocation) gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    if (textureLocation) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(textureLocation, 0);
    }

    // Set identity matrices for MVP
    const mvMatrixLocation = gl.getUniformLocation(program, 'uMVMatrix');
    const pMatrixLocation = gl.getUniformLocation(program, 'uPMatrix');
    const textureMatrixLocation = gl.getUniformLocation(program, 'uTextureMatrix');

    const identityMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);

    if (mvMatrixLocation) gl.uniformMatrix4fv(mvMatrixLocation, false, identityMatrix);
    if (pMatrixLocation) gl.uniformMatrix4fv(pMatrixLocation, false, identityMatrix);
    if (textureMatrixLocation) gl.uniformMatrix4fv(textureMatrixLocation, false, identityMatrix);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animationRef.current = requestAnimationFrame(render);
  }, []);

  // Handle mouse movement
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1.0 - (event.clientY - rect.top) / rect.height; // Flip Y coordinate
    
    mouseRef.current = { x, y };
  }, []);

  // Initialize WebGL on mount
  useEffect(() => {
    initWebGL();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initWebGL]);

  // Start render loop when WebGL is ready
  useEffect(() => {
    if (glInitialized) {
      animationRef.current = requestAnimationFrame(render);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [glInitialized, render]);

  // Load texture when image URL changes
  useEffect(() => {
    if (displayedImageUrl && glInitialized) {
      loadImageTexture(displayedImageUrl);
    }
  }, [displayedImageUrl, glInitialized, loadImageTexture]);

  // Determine the animation class based on state
  const getImageClassName = () => {
    if (isFadingOut || imageLoading) {
      return 'opacity-0 scale-95';
    }
    return 'opacity-100 scale-100';
  };

  return (
    <div className="w-full rounded-2xl border-gradient backdrop-blur-[10px] dark:backdrop-blur-[10px] dark:bg-white/10 shadow-lg p-2">
      <div className="w-full aspect-[4/3] bg-white/10 rounded-xl overflow-hidden">
        <div className="relative w-full h-full">
          {isLoading && !displayedImageUrl ? (
            // Initial loading state
            <div className="w-full h-full skeleton-base rounded-xl"></div>
          ) : displayedImageUrl && glInitialized ? (
            <>
              {imageLoading && !isFadingOut && (
                // Loading overlay for new image
                <div className="absolute inset-0 z-10 skeleton-base rounded-xl"></div>
              )}
              <canvas 
                ref={canvasRef}
                className={`w-full h-full rounded-xl transition-all duration-300 ${isFadingOut ? 'ease-out' : 'ease-in'} ${getImageClassName()}`}
                onMouseMove={handleMouseMove}
                style={{ display: 'block' }}
              />
            </>
          ) : (
            // Fallback placeholder
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-[1.75px] shadow-[0px_5px_15px_rgba(0,0,0,0.25),inset_0px_-2px_10px_rgba(158,158,170,0.25)] border border-white/50 backdrop-blur-[5px] flex items-center justify-center">
                <Image 
                  src="/favicon.ico" 
                  alt="ShotDeckAI Logo" 
                  width={32} 
                  height={32}
                  className="w-7 h-7 md:w-8 md:h-8"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 