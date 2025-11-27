"use client";
import React, { forwardRef } from "react";
import { Shader } from "react-shaders";
import { cn } from "@/lib/utils";

export interface Fire3DShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  intensity?: number;
  fadeProgress?: number; // 0 = hidden, 1 = full visible
}

const fragmentShader = `
precision highp float;

// 3D Simplex Noise (credit: Ian McEwan, Ashima Arts)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fractal Brownian Motion (FBM) for turbulence
float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for(int i = 0; i < 5; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Fire color gradient (cinematic)
vec3 fireColor(float t) {
    // Black -> Deep Red -> Orange -> Yellow -> White
    vec3 col1 = vec3(0.1, 0.0, 0.0);      // Dark red/black
    vec3 col2 = vec3(1.0, 0.1, 0.0);      // Bright red
    vec3 col3 = vec3(1.0, 0.5, 0.0);      // Orange
    vec3 col4 = vec3(1.0, 0.9, 0.2);      // Yellow
    vec3 col5 = vec3(1.0, 1.0, 0.9);      // Near white

    t = clamp(t, 0.0, 1.0);

    if(t < 0.25) {
        return mix(col1, col2, t * 4.0);
    } else if(t < 0.5) {
        return mix(col2, col3, (t - 0.25) * 4.0);
    } else if(t < 0.75) {
        return mix(col3, col4, (t - 0.5) * 4.0);
    } else {
        return mix(col4, col5, (t - 0.75) * 4.0);
    }
}

void mainImage(out vec4 fragColor, vec2 fragCoord) {
    // Normalize coordinates
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    float time = iTime * u_speed;

    // Create flame shape (wider at bottom, narrow at top)
    float dist = length(uv * vec2(1.0, 1.5));
    float flameShape = 1.0 - smoothstep(0.0, 0.8, dist);

    // Vertical gradient (stronger at bottom)
    float vertGrad = smoothstep(-0.6, 0.8, -uv.y);

    // Multi-octave turbulence with rising motion
    vec3 noiseCoord = vec3(uv * 2.0, time * 0.3);
    noiseCoord.y -= time * 0.8; // Rising flame

    float turbulence = fbm(noiseCoord);

    // Add warping/distortion
    vec3 warpCoord = vec3(uv * 3.0, time * 0.2);
    float warp = fbm(warpCoord + vec3(turbulence * 0.5));

    // Combine for final flame density
    float flameDensity = flameShape * vertGrad;
    flameDensity *= (0.5 + 0.5 * turbulence);
    flameDensity *= (0.7 + 0.3 * warp);

    // Apply intensity and fade
    flameDensity *= u_intensity * u_fadeProgress;

    // Inner core (very bright)
    float core = smoothstep(0.6, 1.0, flameDensity);

    // Color mapping
    vec3 color = fireColor(flameDensity * 1.5);

    // Add brightness to core
    color += vec3(core * 2.0);

    // Add glow/bloom effect
    float glow = pow(flameDensity, 0.5) * 0.5;
    color += vec3(glow) * vec3(1.0, 0.6, 0.2);

    // Final alpha (soft edges)
    float alpha = smoothstep(0.0, 0.3, flameDensity) * u_fadeProgress;

    fragColor = vec4(color, alpha);
}
`;

export const Fire3DShaders = forwardRef<HTMLDivElement, Fire3DShadersProps>(
  ({
    className,
    speed = 1.0,
    intensity = 1.5,
    fadeProgress = 1.0,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative w-full h-full', className)}
        {...props}
      >
        <div className="absolute inset-0">
          <Shader
            fs={fragmentShader}
            uniforms={{
              u_speed: { type: '1f', value: speed },
              u_intensity: { type: '1f', value: intensity },
              u_fadeProgress: { type: '1f', value: fadeProgress },
            }}
            style={{ width: '100%', height: '100%' } as any}
          />
        </div>
        {children}
      </div>
    );
  }
);

Fire3DShaders.displayName = "Fire3DShaders";
