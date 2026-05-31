import { useEffect, useRef } from 'react';

export const landscapeState = {
  addText: (text: string) => {}
};

// Perlin Noise Implementation for organic waves
const PERM = new Uint8Array(512);
// Ensure determinism across renders or just random is fine. Using random here to make it unique per load.
for (let i = 0; i < 256; i++) {
  PERM[i] = Math.floor(Math.random() * 256);
}
for (let i = 0; i < 256; i++) {
  PERM[i + 256] = PERM[i];
}

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t: number, a: number, b: number) { return a + t * (b - a); }
function grad(hash: number, x: number, y: number) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin2D(x: number, y: number) {
  let X = Math.floor(x) & 255;
  let Y = Math.floor(y) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  
  const u = fade(x);
  const v = fade(y);
  
  const A = PERM[X] + Y;
  const B = PERM[X + 1] + Y;
  
  return lerp(v, 
    lerp(u, grad(PERM[A], x, y), grad(PERM[B], x - 1, y)),
    lerp(u, grad(PERM[A + 1], x, y - 1), grad(PERM[B + 1], x - 1, y - 1))
  );
}

interface Particle {
  baseX: number; 
  baseDepth: number; 
  char: string;
  isTyped: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  jitterX: number;
  jitterY: number;
  mass: number;
  tier: number;
  spawnTime?: number;
}

interface CloudWord {
  text: string;
  dx: number;
  dy: number;
  font: string;
  alpha: number;
}

interface CloudLetter {
  char: string;
  rx: number;
  ry: number;
  speed: number;
  phase: number;
  size: number;
  alpha: number;
}

interface ThoughtCloud {
  x: number;
  y: number;
  speed: number;
  floatSeed: number;
  words: CloudWord[];
  letters: CloudLetter[];
}

interface WindLineLetter {
  char: string;
  tRatio: number;
  slideSpeed: number;
  size: number;
  alpha: number;
}

interface WindLine {
  id: number;
  y: number;
  x: number;
  speed: number;
  length: number;
  amplitude: number;
  frequency: number;
  width: number;
  opacity: number;
  age: number;
  life: number;
  letters: WindLineLetter[];
}

const DEFAULT_TEXT = "theimmensedarkseawherewevoyage";

export default function Landscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let thoughtClouds: ThoughtCloud[] = [];
    let windLines: WindLine[] = [];
    let w = window.innerWidth;
    let h = window.innerHeight;
    let dpr = window.devicePixelRatio || 1;

    const COL_WIDTH = 15;
    let cols = 0;
    let waterHeights: number[] = [];
    let waterVels: number[] = [];

    let mouseX = -1000;
    let mouseY = -1000;
    let pmouseX = -1000;
    let pmouseY = -1000;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    let boatY = 0;
    let boatVy = 0;
    let boatAngle = 0;
    let boatVa = 0;
    let boatSurge = 0;
    let boatSurgeVx = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      w = canvas.parentElement.clientWidth;
      h = canvas.parentElement.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      cols = Math.ceil(w / COL_WIDTH) + 2;
      const newHeights = new Array(cols).fill(0);
      const newVels = new Array(cols).fill(0);
      for(let i = 0; i < Math.min(waterHeights.length, cols); i++) {
        newHeights[i] = waterHeights[i];
        newVels[i] = waterVels[i];
      }
      waterHeights = newHeights;
      waterVels = newVels;

      if (typeof initParticles === 'function') {
        initParticles();
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Mathematical definition of the landscape topology
    function getBaseSurfaceY(x: number, time: number) {
      if (x > w) return h * 0.5; // Inside the spout, perfectly flat horizontal stream

      const startY = h * 0.68;
      
      // Multilayered Perlin noise for organic, non-repeating turbulent waves
      const nx = x * 0.0018;
      const ny = time * 0.0003;
      
      // Add a slow, massive underlying swell
      const globalSwell = Math.sin(x * 0.0008 + time * 0.0004) * 20 + 20;

      const n1 = perlin2D(nx, ny) * 35;
      const n2 = perlin2D(nx * 2.1, ny * 1.6) * 18;
      const n3 = perlin2D(nx * 4.4, ny * 2.4) * 8;
      const n4 = perlin2D(nx * 8.2, ny * 3.3) * 4;
      
      const flatSeaY = startY + globalSwell + n1 + n2 + n3 + n4;

      // The sweeping waterfall connecting the panel (h * 0.5) to the sea body
      const waterfallStart = w * 0.70;
      if (x > waterfallStart) {
        const t = (x - waterfallStart) / (w - waterfallStart);
        // Extremely smooth interpolation curve down the cliff
        const curvedT = Math.pow(Math.max(0, t), 2.8); 
        return flatSeaY * (1 - curvedT) + (h * 0.5) * curvedT; 
      }
      
      return flatSeaY;
    }

    function getSurfaceY(x: number, time: number) {
        const base = getBaseSurfaceY(x, time);
        const col = x / COL_WIDTH;
        const index = Math.floor(col);
        const frac = col - index;
        
        let h1 = 0;
        let h2 = 0;
        if (index >= 0 && index < cols) h1 = waterHeights[index];
        if (index + 1 >= 0 && index + 1 < cols) h2 = waterHeights[index + 1];
        
        const extraH = h1 * (1 - frac) + h2 * frac; 
        return base + extraH;
    }

      function initParticles() {
       const existingTyped = particles.filter(p => p.isTyped);
       particles = [];
       // Adaptive spacing based on screen width for stunning fluid rendering & high-performance on mobile
       const spacing = w < 768 ? 14 : 8;
       const colsCount = Math.ceil((w + 200) / spacing); 
       const rowsCount = Math.ceil(h / spacing); 
       
       let charIndex = 0;
       for (let c = 0; c < colsCount; c++) {
           for (let r = 0; r < rowsCount; r++) {
               const baseX = c * spacing - 100;
               const baseDepth = r * spacing;
               const jitterX = (Math.random() - 0.5) * spacing;
               const jitterY = (Math.random() - 0.5) * spacing;
               
               const rand = Math.random();
               let tier = 0; 
               if (rand > 0.95) tier = 2; 
               else if (rand > 0.85) tier = 1; 

               const startY = getSurfaceY(baseX + jitterX, 0) + baseDepth + jitterY;
               
               particles.push({
                   baseX: baseX,
                   baseDepth: baseDepth,
                   char: DEFAULT_TEXT[charIndex % DEFAULT_TEXT.length],
                   isTyped: false,
                   x: baseX + jitterX,
                   y: startY,
                   vx: 0,
                   vy: 0,
                   jitterX: jitterX,
                   jitterY: jitterY,
                   mass: 0.8 + Math.random() * 0.5,
                   tier: tier
               });
               charIndex++;
           }
       }

      boatY = getSurfaceY(w * 0.4, 0);
      boatVy = 0;
      boatAngle = 0;
      boatVa = 0;
      initThoughtClouds();
     }

     function initThoughtClouds() {
       const generateLettersForCloud = (wordList: { text: string }[]): CloudLetter[] => {
         const list: CloudLetter[] = [];
         const chars = wordList.flatMap(w => w.text.split("").filter(ch => ch !== " ")).concat(
           "s", "o", "l", "i", "t", "u", "d", "e", "d", "r", "i", "f", "t", "w", "i", "n", "d", "s", "e", "a",
           "m", "o", "o", "n", "g", "l", "o", "w", "n", "i", "g", "h", "t", "v", "o", "y", "a", "g", "e", "s", "i", "l", "e", "n", "t"
         );
         
         // Elliptical cloud volume mapping for pristine high-end silhouettes
         for (let i = 0; i < 75; i++) {
           const char = chars[Math.floor(Math.random() * chars.length)] || "e";
           const theta = Math.random() * Math.PI * 2;
           const rFactor = Math.sqrt(Math.random()); // higher concentration towards center core
           const rx = Math.cos(theta) * 220 * rFactor;
           const ry = Math.sin(theta) * 55 * rFactor;
           list.push({
             char,
             rx,
             ry,
             speed: 0.35 + Math.random() * 0.95,
             phase: Math.random() * Math.PI * 2,
             size: 9 + Math.floor(Math.random() * 10),
             alpha: 0.14 + Math.random() * 0.28
           });
         }
         return list;
       };

       const presets = [
         // Cloud 1
         [
           { text: "solitude", dx: 0, dy: 0, font: 'italic 28px "Playfair Display", Georgia, serif', alpha: 0.70 },
           { text: "quiet dream", dx: -130, dy: -32, font: 'italic 16px "Playfair Display", Georgia, serif', alpha: 0.48 },
           { text: "musing", dx: 120, dy: 24, font: 'italic 21px "Playfair Display", Georgia, serif', alpha: 0.52 },
           { text: "echoes", dx: -85, dy: 35, font: '14px "JetBrains Mono", monospace', alpha: 0.42 },
           { text: "fading", dx: 100, dy: -35, font: '13px "JetBrains Mono", monospace', alpha: 0.45 }
         ],
         // Cloud 2
         [
           { text: "remember", dx: 0, dy: 0, font: 'italic 29px "Playfair Display", Georgia, serif', alpha: 0.68 },
           { text: "shadows", dx: -130, dy: 26, font: '15px "JetBrains Mono", monospace', alpha: 0.44 },
           { text: "distant", dx: 105, dy: -34, font: '14px "JetBrains Mono", monospace', alpha: 0.48 },
           { text: "timeless", dx: -80, dy: -30, font: 'italic 17px "Playfair Display", Georgia, serif', alpha: 0.50 },
           { text: "drift", dx: 125, dy: 30, font: '16px "JetBrains Mono", monospace', alpha: 0.46 }
         ],
         // Cloud 3
         [
           { text: "passages", dx: 0, dy: 0, font: 'italic 27px "Playfair Display", Georgia, serif', alpha: 0.65 },
           { text: "silent wind", dx: -145, dy: -30, font: '15px "JetBrains Mono", monospace', alpha: 0.46 },
           { text: "lonely star", dx: 110, dy: 32, font: 'italic 18px "Playfair Display", Georgia, serif', alpha: 0.50 },
           { text: "space", dx: -70, dy: 38, font: '14px "JetBrains Mono", monospace', alpha: 0.40 },
           { text: "untold", dx: 115, dy: -25, font: '15px "JetBrains Mono", monospace', alpha: 0.44 }
         ],
         // Cloud 4
         [
           { text: "infinite", dx: 0, dy: 0, font: 'italic 30px "Playfair Display", Georgia, serif', alpha: 0.70 },
           { text: "harbor", dx: -115, dy: -34, font: '15px "JetBrains Mono", monospace', alpha: 0.44 },
           { text: "longing", dx: 120, dy: 32, font: 'italic 18px "Playfair Display", Georgia, serif', alpha: 0.52 },
           { text: "trace", dx: -95, dy: 26, font: '14px "JetBrains Mono", monospace', alpha: 0.42 },
           { text: "sea of ink", dx: 100, dy: -28, font: '13px "JetBrains Mono", monospace', alpha: 0.46 }
         ]
       ];

       thoughtClouds = [
         {
           x: w * 0.15,
           y: h * 0.24, // Clear of the title zone
           speed: 0.15,
           floatSeed: Math.random() * 100,
           words: presets[0],
           letters: generateLettersForCloud(presets[0])
         },
         {
           x: w * 0.45,
           y: h * 0.35, // Low-level flow
           speed: 0.11,
           floatSeed: Math.random() * 100,
           words: presets[1],
           letters: generateLettersForCloud(presets[1])
         },
         {
           x: w * 0.72,
           y: h * 0.29, // Stacked level
           speed: 0.18,
           floatSeed: Math.random() * 100,
           words: presets[2],
           letters: generateLettersForCloud(presets[2])
         },
         {
           x: w * 1.05,
           y: h * 0.40, // High-mid sky
           speed: 0.13,
           floatSeed: Math.random() * 100,
           words: presets[3],
           letters: generateLettersForCloud(presets[3])
         }
       ];
     }
    initParticles();

    let textBuffer = "";
    let fullTextHistory = "";
    landscapeState.addText = (text: string) => {
      textBuffer += text;
      fullTextHistory += text;
    };

    let animationFrameId: number;
    let time = 0;
    let lastSpawnTime = 0;
    let lastFrameTime = performance.now();

    // Utility: detect mobile
    const isMobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);

    const render = () => {
      const now = performance.now();
      let delta = now - lastFrameTime;
      lastFrameTime = now;
      // Clamp delta to avoid huge jumps on tab switch
      delta = Math.max(8, Math.min(delta, 48));
      // Slow down animation on mobile
      // Make mobile much slower and more dreamy
      if (isMobile) delta *= 0.45;
      // Add gentle easing for a dreamy effect
      const easedDelta = delta * (0.7 + 0.3 * Math.sin(now * 0.00012));
      time += easedDelta;
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, w, h);

       // Update & Render "Thought Clouds" drifting in the sky background
       ctx.textAlign = 'center';
       for (let i = 0; i < thoughtClouds.length; i++) {
         const cloud = thoughtClouds[i];
         
         // Drift slowly to the left
         cloud.x -= cloud.speed;
         
         // Wrap around to the right side if it goes completely off screen
         if (cloud.x < -350) {
           cloud.x = w + 350 + Math.random() * 150;
           // Lane-based re-rolls: keeping clouds in distinct vertical paths so they never overlap
           const minHeight = 0.23 + i * 0.055; // Cloud 0: 0.23, Cloud 1: 0.285, Cloud 2: 0.34, Cloud 3: 0.395
           cloud.y = h * (minHeight + Math.random() * 0.035);
           cloud.speed = 0.10 + Math.random() * 0.10;   // Re-roll speed
         }
         
         // Faint, organic breathing/floating offset
         const floatY = Math.sin(time * 0.0006 + cloud.floatSeed) * 10;
         
         // Calculate progressive, smooth edge fading as the cloud enters/exits life span
         const startRange = w + 350;
         const endRange = -350;
         const totalPathLen = startRange - endRange;
         const progress = (cloud.x - endRange) / totalPathLen; // ranges from 1.0 (right) down to 0.0 (left)
         const easeFade = Math.max(0, Math.min(1, Math.sin(progress * Math.PI))); // Sine-based perfect fade in and fade out
         
         // Breathe words dynamically (stretching cloud size slightly)
         const spacingScale = 1.0 + Math.sin(time * 0.0004 + cloud.floatSeed * 2.5) * 0.10;
         
         // Draw high-fidelity atmospheric fluid/cloud puffs representing genuine, voluminous clouds
         if (easeFade > 0.01) {
           ctx.save();
           // Draw 5 overlapping soft lunar puffs to create an impressive, majestic silhouette
           for (let pIdx = 0; pIdx < 5; pIdx++) {
             const pSeed = cloud.floatSeed + pIdx * 25;
             const pOffsetDist = 80 * spacingScale;
             const px = cloud.x + Math.sin(time * 0.00015 + pSeed) * pOffsetDist;
             const py = cloud.y + floatY + Math.cos(time * 0.00025 + pSeed) * (pOffsetDist * 0.3);
             const radius = (200 + Math.sin(time * 0.0004 + pSeed) * 60) * spacingScale;
             
             const grad = ctx.createRadialGradient(px, py, 5, px, py, radius);
             // Perfect soft atmospheric layering opacity stops
             grad.addColorStop(0, `rgba(246, 246, 242, ${0.055 * easeFade})`);
             grad.addColorStop(0.4, `rgba(246, 246, 242, ${0.025 * easeFade})`);
             grad.addColorStop(0.8, `rgba(246, 246, 242, ${0.008 * easeFade})`);
             grad.addColorStop(1, `rgba(246, 246, 242, 0)`);
             ctx.fillStyle = grad;
             ctx.beginPath();
             ctx.arc(px, py, radius, 0, Math.PI * 2);
             ctx.fill();
           }
           ctx.restore();
         }
         
         // Draw thought words floating inside/around the Cloud
          // Draw dense, streaming text-letters inside/around the cloud, moving like a stream
          if (cloud.letters) {
            for (let lIdx = 0; lIdx < cloud.letters.length; lIdx++) {
              const letter = cloud.letters[lIdx];
              
              // Drift right-to-left relative to cloud boundaries (the windcurrent)
              letter.rx -= letter.speed * 1.5;
              if (letter.rx < -220) {
                letter.rx = 220;
                letter.ry = -55 + Math.random() * 110;
                letter.speed = 0.35 + Math.random() * 1.0;
              }
              
              // Dynamic wave-like streamline vertical offset
              const ryOffset = Math.sin(time * 0.002 + letter.phase + letter.rx * 0.015) * 16;
              const lx = cloud.x + letter.rx * spacingScale;
              const ly = cloud.y + (letter.ry + ryOffset) * spacingScale + floatY;
              
              if (lx > -350 && lx < w + 350) {
                // Fade out smoothly at boundaries
                const cloudRelativeEdgeFade = Math.max(0, Math.min(1, Math.sin(((letter.rx + 280) / 560) * Math.PI)));
                
                // Interactive glowing shimmer
                const shimmer = Math.sin(time * 0.004 + letter.phase) * 0.25 + 0.75;
                
                ctx.font = `bold ${letter.size}px "JetBrains Mono", monospace`;
                ctx.fillStyle = '#f6f6f2';
                ctx.globalAlpha = letter.alpha * easeFade * cloudRelativeEdgeFade * shimmer * 0.95;
                ctx.fillText(letter.char, lx, ly);
              }
            }
          }

         for (let wIdx = 0; wIdx < cloud.words.length; wIdx++) {
           const word = cloud.words[wIdx];
           
           // Orbit/swim orbit offset
           const wordSwimX = Math.sin(time * 0.0008 + wIdx * 2.1) * 12;
           const wordSwimY = Math.cos(time * 0.0006 + wIdx * 1.5) * 8;
           const wx = cloud.x + (word.dx + wordSwimX) * spacingScale;
           const wy = cloud.y + (word.dy + wordSwimY) * spacingScale + floatY;
           
           if (wx > -350 && wx < w + 350) {
             ctx.font = word.font;
             ctx.fillStyle = '#f6f6f2';
             ctx.globalAlpha = word.alpha * easeFade;
             ctx.fillText(word.text, wx, wy);
           }
         }
       }
       ctx.globalAlpha = 1.0; // Restore globalAlpha

        // --- 1B. RANDOM ATMOSPHERIC WIND FLOW LINES ---
        // Dynamically spawn new twisted wind flow lines (aesthetic feedback)
        if (Math.random() < 0.007 && windLines.length < 4) {
          const charsPreset = [
            "w", "i", "n", "d", "b", "r", "e", "e", "z", "e", "s", "i", "l", "e", "n", "t",
            "d", "r", "i", "f", "t", "w", "u", "s", "t", "g", "l", "o", "w", "a", "i", "r",
            "c", "u", "r", "r", "e", "n", "t", "m", "u", "s", "i", "n", "g", "j", "o", "u", "r", "n", "e", "y", "s", "e", "a"
          ];
          const lineLength = 260 + Math.random() * 320;
          const letterCount = 3 + Math.floor(Math.random() * 5);
          const letters: WindLineLetter[] = [];
          for (let c = 0; c < letterCount; c++) {
            letters.push({
              char: charsPreset[Math.floor(Math.random() * charsPreset.length)],
              tRatio: Math.random(),
              slideSpeed: 0.0016 + Math.random() * 0.0034,
              size: 9 + Math.floor(Math.random() * 6),
              alpha: 0.22 + Math.random() * 0.38
            });
          }

          windLines.push({
            id: Date.now() + Math.random(),
            y: h * (0.05 + Math.random() * 0.28), // spawn in the general sky/cloud zones
            x: w + 200, // starts offscreen right
            speed: 1.6 + Math.random() * 2.4, // moving smoothly right-to-left
            length: lineLength,
            amplitude: 16 + Math.random() * 24, // wave amplitude of twist
            frequency: 0.003 + Math.random() * 0.005, // wavelength density helper
            width: 0.8 + Math.random() * 1.4,
            opacity: 0.12 + Math.random() * 0.16, // soft glowing ambient visibility
            age: 0,
            life: 350 + Math.floor(Math.random() * 250), // frame lifetime
            letters: letters
          });
        }

        // Update and draw active wind lines
        for (let idx = windLines.length - 1; idx >= 0; idx--) {
          const line = windLines[idx];
          line.age++;
          line.x -= line.speed;

          // Progress ratio and life fade
          const remainingFactor = (line.life - line.age) / line.life;
          const startFactor = Math.min(1, line.age / 50); // fade in gracefully
          const endFactor = Math.max(0, Math.min(1, remainingFactor * 4)); // fade out at the end
          const easeAgeFade = startFactor * endFactor;

          // Recycle if dead or fully moved offscreen left
          if (line.age >= line.life || line.x < -line.length - 200) {
            windLines.splice(idx, 1);
            continue;
          }

          // Draw multiple parallel twisted wisps for a dynamic flowing ribbon/airflow look
          ctx.save();
          const steps = 40;
          for (let strand = 0; strand < 3; strand++) {
            ctx.beginPath();
            let first = true;
            const strandYOffset = (strand - 1) * 6; // displacement on Y-axis
            const strandPhaseOffset = strand * 1.1;
            const strandAmpScale = (strand === 1) ? 1.0 : 0.65;
            const alphaScale = (strand === 1) ? 1.0 : 0.45;

            for (let s = 0; s <= steps; s++) {
              const tRatio = s / steps;
              const px = line.x + tRatio * line.length;
              const endTaper = Math.sin(tRatio * Math.PI); // taper down to ends

              // Intricate multi-frequency sine equations to synthesize rich, twisted airflow ribbon shapes
              const wave1 = Math.sin(px * line.frequency + time * 0.0022 + strandPhaseOffset) * line.amplitude * strandAmpScale;
              const wave2 = Math.cos(px * (line.frequency * 0.45) - time * 0.0011) * (line.amplitude * 0.35);
              const py = line.y + (wave1 + wave2) * endTaper + strandYOffset;

              if (first) {
                ctx.moveTo(px, py);
                first = false;
              } else {
                ctx.lineTo(px, py);
              }
            }

            // Linear gradient to gracefully fade ribbon tips out
            const grad = ctx.createLinearGradient(line.x, line.y, line.x + line.length, line.y);
            const opac = line.opacity * easeAgeFade * alphaScale;
            grad.addColorStop(0, 'rgba(246, 246, 242, 0)');
            grad.addColorStop(0.2, `rgba(246, 246, 242, ${opac})`);
            grad.addColorStop(0.8, `rgba(246, 246, 242, ${opac})`);
            grad.addColorStop(1, 'rgba(246, 246, 242, 0)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = line.width * ((strand === 1) ? 1.0 : 0.55);
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(246, 246, 242, 0.12)';
            ctx.stroke();
          }
          ctx.restore();

          // Render cute, tiny typographical indicators gliding seamlessly along the wind current ribbon
          for (let c = 0; c < line.letters.length; c++) {
            const letter = line.letters[c];
            // Flow along the current
            letter.tRatio -= letter.slideSpeed;
            if (letter.tRatio < 0) {
              letter.tRatio = 1.0; // loop back to the tail of the current
            }

            const lx = line.x + letter.tRatio * line.length;
            const endTaper = Math.sin(letter.tRatio * Math.PI);

            const wave1 = Math.sin(lx * line.frequency + time * 0.0022) * line.amplitude;
            const wave2 = Math.cos(lx * (line.frequency * 0.45) - time * 0.0011) * (line.amplitude * 0.35);
            const ly = line.y + (wave1 + wave2) * endTaper;

            const letterOpacity = letter.alpha * easeAgeFade * endTaper;
            if (letterOpacity > 0.01 && lx > -10 && lx < w + 10) {
              ctx.save();
              ctx.font = `italic 500 ${letter.size}px "JetBrains Mono", monospace`;
              ctx.fillStyle = '#f6f6f2';
              ctx.globalAlpha = letterOpacity;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Light harmonic float offset
              const wiggleY = Math.sin(time * 0.0025 + letter.tRatio * 12) * 3;
              ctx.fillText(letter.char, lx, ly - 8 + wiggleY);
              ctx.restore();
            }
          }
        }
        ctx.globalAlpha = 1.0; // Restore globalAlpha

      // 1. Particle Spawning (Typed Stream)
      if (textBuffer.length === 0 && fullTextHistory.length > 0) {
         textBuffer = fullTextHistory;
      }

      if (textBuffer.length > 0 && (time - lastSpawnTime > 70)) {
         lastSpawnTime = time;
         
         let char = textBuffer[0];
         textBuffer = textBuffer.slice(1);
         if (char === '\n') char = ' ';
         
         // Find the furthest right particle's base position to queue new text behind it
         let maxBaseX = w; 
         for (let j = 0; j < particles.length; j++) {
             if (particles[j].isTyped && particles[j].baseX > maxBaseX) {
                 maxBaseX = particles[j].baseX;
             }
         }

         // Line characters up perfectly along x
         const targetBaseX = Math.max(w + 200, maxBaseX + 16); 
         const deepDepth = 30 + Math.random() * 50; // Flow in the middle layer of the stream
         
         particles.push({
             baseX: targetBaseX, 
             baseDepth: deepDepth, 
             char: char,
             isTyped: true,
             x: targetBaseX, 
             y: getSurfaceY(targetBaseX, time) + deepDepth, 
             vx: 0,
             vy: 0,
             jitterX: 0,
             jitterY: 0,
             mass: 1.0, 
             tier: 3,
             spawnTime: time
         });
      }

      // Cleanup aged user types to prevent infinite memory growth
      particles = particles.filter(p => !p.isTyped || p.baseX > -100);

      const flowSpeed = 2.5;

      // Update water springs
      const mouseDx = pmouseX !== -1000 ? mouseX - pmouseX : 0;
      const mouseDy = pmouseY !== -1000 ? mouseY - pmouseY : 0;
      const mouseSpeedSq = mouseDx*mouseDx + mouseDy*mouseDy;
      const absMouseDy = Math.abs(mouseDy);

      if (absMouseDy > 1 && pmouseY !== -1000) {
          const mCol = Math.floor(mouseX / COL_WIDTH);
          if (mCol >= 0 && mCol < cols) {
              const bY = getBaseSurfaceY(mouseX, time);
              // Only disturb water surface if mouse is moving vertically near it
              if (Math.abs(mouseY - bY) < 150) {
                 const clampedDy = Math.max(-50, Math.min(50, mouseDy));
                 waterVels[mCol] += clampedDy * 0.3; 
                 if (mCol > 0) waterVels[mCol - 1] += clampedDy * 0.15;
                 if (mCol < cols - 1) waterVels[mCol + 1] += clampedDy * 0.15;
              }
          }
      }
      pmouseX = mouseX;
      pmouseY = mouseY;

      const TENSION = 0.025;
      const DAMPING = 0.94;
      const SPREAD = 0.25;
      const VISCOSITY = 0.08;

      for (let i = 0; i < cols; i++) {
         waterVels[i] += -TENSION * waterHeights[i];
         waterVels[i] *= DAMPING;
      }
      
      // Viscosity helps smooth out the waves preventing erratic spiky behavior
      for(let i = 1; i < cols - 1; i++) {
          const neighborVel = (waterVels[i-1] + waterVels[i+1]) / 2;
          waterVels[i] += (neighborVel - waterVels[i]) * VISCOSITY;
      }

      for (let i = 0; i < cols; i++) {
         waterHeights[i] += waterVels[i];
      }

      const leftDeltas = new Float32Array(cols);
      const rightDeltas = new Float32Array(cols);

      for (let j = 0; j < 3; j++) {
          for (let i = 0; i < cols; i++) {
              if (i > 0) leftDeltas[i] = SPREAD * (waterHeights[i] - waterHeights[i-1]);
              if (i < cols - 1) rightDeltas[i] = SPREAD * (waterHeights[i] - waterHeights[i+1]);
          }
          for (let i = 0; i < cols; i++) {
              if (i > 0) {
                  waterHeights[i-1] += leftDeltas[i];
                  waterVels[i-1] += leftDeltas[i];
              }
              if (i < cols - 1) {
                  waterHeights[i+1] += rightDeltas[i];
                  waterVels[i+1] += rightDeltas[i];
              }
          }
      }

      // Physics Integration Loop
      for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          
          if (!p.isTyped) {
              // Parallax: Depth-based slower movement, while larger/closer tiers move faster
              const parallaxSpeed = flowSpeed * (0.6 + p.tier * 0.3); // tier 0 = 0.6x, tier 1 = 0.9x, tier 2 = 1.2x
              p.baseX -= parallaxSpeed;
              if (p.baseX < -100) {
                  p.baseX += (w + 200);
                  p.x = p.baseX + p.jitterX; // reset X
                  p.y = getSurfaceY(p.x, time) + p.baseDepth + p.jitterY;
                  p.vy = 0;
                  p.vx = 0;
              }
          } else {
              // Typed text flows along with the fastest current 
              p.baseX -= flowSpeed * 1.2;
          }
          
          const targetX = p.baseX + p.jitterX;
          
          let isDiving = false;
          let effectiveDepth = p.baseDepth + p.jitterY;

          if (p.isTyped) {
              const streamDiveStartX = w - 150; // Descend visibly on screen
              const streamDiveEndX = w * 0.6;
              const arcStartX = w + 50;
              
              if (targetX >= arcStartX) {
                  p.x = targetX;
                  p.y = h * 0.15;
                  p.vy = 0; p.vx = 0;
                  isDiving = true;
              } else if (targetX > streamDiveStartX) {
                  p.x = targetX;
                  // Smooth S-Curve (ease-in-out) from panel to the surface
                  const t = (targetX - streamDiveStartX) / (arcStartX - streamDiveStartX);
                  const startY = h * 0.15;
                  const endY = getSurfaceY(targetX, time);
                  
                  const u = 1 - t; // goes from 0 to 1
                  const ease = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; // smooth ease in out
                  p.y = startY * (1 - ease) + endY * ease;
                  p.vy = 0; p.vx = 0;
                  isDiving = true;
              } else if (targetX > streamDiveEndX) {
                  const t = 1 - ((targetX - streamDiveEndX) / (streamDiveStartX - streamDiveEndX));
                  const ease = t * t * (3 - 2 * t);
                  effectiveDepth = ease * p.baseDepth;
              }
          }

          // Mouse repel
          if (!isDiving) {
              const pdx = mouseX - p.x;
              const pdy = mouseY - p.y;
              const repelRadius = 120;
              // Bounding box heuristic to avoid expensive square root
              if (Math.abs(pdx) < repelRadius && Math.abs(pdy) < repelRadius) {
                  const distSq = pdx*pdx + pdy*pdy;
                  const repelRadiusSq = repelRadius * repelRadius;
                  
                  if (distSq < repelRadiusSq) {
                      const dist = Math.sqrt(distSq);
                      // Force falls off quadratically
                      const force = Math.pow((repelRadius - dist) / repelRadius, 2.0);
                      
                      // 1. Gently repel outwards from the cursor
                      p.vx -= (pdx / dist) * force * 6;
                      p.vy -= (pdy / dist) * force * 6;
                      
                      // 2. Viscous drag: Mouse movement pulls particles along with it smoothly
                      if (mouseSpeedSq > 1) {
                          // Cap the dragging speed
                          const dragStrength = Math.min(1.0, mouseSpeedSq * 0.005);
                          p.vx += mouseDx * force * dragStrength * 0.15;
                          p.vy += mouseDy * force * dragStrength * 0.15;
                      }
                  }
              }

              const targetY = getSurfaceY(targetX, time) + effectiveDepth;

              // X Spring
              p.vx += (targetX - p.x) * 0.05;
              p.x += p.vx;
              p.vx *= 0.85;

              // Y Spring (Buoyancy)
              const stiffness = 0.08 / p.mass;
              const damping = 0.85; 
              
              const forceY = (targetY - p.y) * stiffness;
              p.vy = (p.vy + forceY) * damping;
              p.y += p.vy;
          }
      }

      // 2. Define the exact wave surface clipping path
      const path = new Path2D();
      path.moveTo(0, getSurfaceY(0, time));
      for (let x = 0; x <= w + 100; x += 20) {
        path.lineTo(x, getSurfaceY(x, time));
      }
      path.lineTo(w + 100, h);
      path.lineTo(0, h);
      path.closePath();

      ctx.save();
      ctx.clip(path);

      ctx.textAlign = 'center';

      // 3. Render Background Sea of Text in Batched Tiers for performance
      
      // Helper for rotated text
      const renderRotatedText = (p: Particle) => {
          if (p.x < -20 || (!p.isTyped && p.x > w + 20) || (p.isTyped && p.x > w + 250) || p.y < -50) return;
          
          let angle = 0;
          if (p.isTyped && p.x > w - 150) {
              angle = Math.PI * 0.05; // slight tilt during flight
          } else {
              const dx = 10;
              const y1 = getSurfaceY(p.x - dx, time);
              const y2 = getSurfaceY(p.x + dx, time);
              const baseAngle = Math.atan((y2 - y1) / (dx * 2));
              const wobble = p.isTyped ? 0 : Math.sin(time * 0.003 + p.baseX * 0.02) * 0.1;
              angle = baseAngle + wobble;
          }
          
          ctx.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr);
          ctx.rotate(angle);
          ctx.fillText(p.char, 0, 0);
      };

      // Pass 0: Small text
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#f6f6f2'; // White text for the sea
      ctx.font = '10px "JetBrains Mono", monospace';
      for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p.tier === 0 && p.y < h + 20) {
              if (p.x < -20 || p.x > w + 20 || p.y < 0) continue;
              // Very cheap non-rotated render for tier 0 (small bg text) to save performance!
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
              ctx.fillText(p.char, p.x, p.y);
          }
      }

      // Pass 1: Medium text
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "JetBrains Mono", monospace';
      for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p.tier === 1 && p.y < h + 20) renderRotatedText(p);
      }

      // Pass 2: Large bold text
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p.tier === 2 && p.y < h + 20) renderRotatedText(p);
      }
      
      // Crucial explicit transform reset after the text renders
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Pass 3: Render User Typed Text with a rich, glowing orange bloom processing effect
      ctx.globalAlpha = 1.0;
      ctx.font = 'bold 20px "JetBrains Mono", monospace'; // Slightly bold and pronounced, same style family but glowing

      for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (p.tier === 3 && p.y < h + 20) {
              const pulse = Math.sin(time * 0.005 + p.baseX * 0.05) * 0.4 + 0.6; // Pulsing 0.2 to 1.0
              ctx.fillStyle = '#ffad33'; // Deep golden orange core
              ctx.shadowColor = 'rgba(255, 130, 0, 0.9)'; // Radiant orange bloom
              ctx.shadowBlur = 12 + pulse * 12; // Beautiful high-fidelity bloom glow (12px to 24px)
              
              renderRotatedText(p);
          }
      }
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Reset styles
      ctx.shadowBlur = 0;
      ctx.restore();

      // 4. Solid Foreground Earth Mass
      const base = new Path2D();
      base.moveTo(w * 0.78, h);
      base.lineTo(w * 0.78, h * 0.90);
      base.bezierCurveTo(w * 0.85, h * 0.75, w * 0.92, h * 0.6, w, h * 0.55);
      base.lineTo(w, h);
      base.closePath();

      ctx.fillStyle = '#080808';
      ctx.fill(base);

      // 5. Sync Moominpappa overlay with Buoyant Physics
      const boatEl = document.getElementById('moominpappa-character');
      const oarEl = document.getElementById('moomin-oar');
      
      if (boatEl) {
        boatEl.style.transformOrigin = '160px 185px'; // Adjust origin so it sits slightly lower visually
        
        // Oar & Surge Logic (Rowing cycle)
        const cycleDuration = 3200;
        const cycle = (time % cycleDuration) / cycleDuration;
        let oarAngle = 0;
        let strokeForce = 0;
        let strokePitch = 0;
        
        // Asymmetric rowing simulation: power stroke (pull) vs recovery
        if (cycle < 0.45) {
           const t = cycle / 0.45; 
           oarAngle = -25 + (Math.sin(t * Math.PI / 2) * 50); 
           strokeForce = Math.sin(t * Math.PI) * 2.0; // Stronger pull
           strokePitch = Math.sin(t * Math.PI) * -0.15; // Pitch back slightly when pulling
        } else {
           const t = (cycle - 0.45) / 0.55;
           oarAngle = 25 - (t * 50);
           strokeForce = -(Math.sin(t * Math.PI) * 0.8); // Smooth recovery, naturally balances the positive force
           strokePitch = Math.sin(t * Math.PI) * 0.08; // Pitch forward a bit
        }

        // Apply physical surge to the boat
        boatSurgeVx += strokeForce;
        boatSurgeVx += -boatSurge * 0.04; // Stronger pull back to equilibrium so it doesn't drift
        boatSurgeVx *= 0.88; // Heavier damping
        boatSurge += boatSurgeVx;
        
        const boatX = (w * 0.4) + (boatSurge * 4); // Scaled down visual movement
        
        // Mouse repel for boat
        const bdx = mouseX - boatX;
        const bdy = mouseY - boatY;
        const brepelRadius = 150;
        
        if (Math.abs(bdx) < brepelRadius && Math.abs(bdy) < brepelRadius) {
            const bdistSq = bdx*bdx + bdy*bdy;
            const brepelRadiusSq = brepelRadius * brepelRadius;
            
            if (bdistSq < brepelRadiusSq) {
                const bdist = Math.sqrt(bdistSq);
                const force = Math.pow((brepelRadius - bdist) / brepelRadius, 1.5);
                boatSurgeVx -= (bdx / bdist) * force * 1.5;
                boatVy -= (bdy / bdist) * force * 1.5;
                
                // Add viscous drag for boat too
                if (mouseSpeedSq > 1) {
                   const dragStrength = Math.min(1.0, mouseSpeedSq * 0.005);
                   boatSurgeVx += mouseDx * force * dragStrength * 0.02;
                }
            }
        }

        if (oarEl) {
            oarEl.style.transform = `rotate(${oarAngle}deg)`;
        }

        const dx = 50; // Real bow/stern distance
        const y1 = getSurfaceY(boatX - dx, time);
        const y2 = getSurfaceY(boatX + dx, time);

        const targetBoatY = ((y1 + y2) / 2) + 15; // Sink the boat into the text sea, instead of sitting above it
        
        // Buoyancy spring force for Y
        const bStiffness = 0.06; // Slightly softer buoyancy to prevent erratic bouncing 
        const bDamping = 0.92;
        const bForce = (targetBoatY - boatY) * bStiffness;
        boatVy = (boatVy + bForce) * bDamping;
        boatY += boatVy;

        const targetSlope = (y2 - y1) / (dx * 2);
        const waveAngle = Math.atan(targetSlope) * 1.5; 
        const targetAngle = waveAngle + strokePitch;
        
        // Buoyancy spring force for Angle/Pitch
        const aStiffness = 0.08;
        const aDamping = 0.88;
        const aForce = (targetAngle - boatAngle) * aStiffness;
        boatVa = (boatVa + aForce) * aDamping;
        boatAngle += boatVa;

        // Position the exact transform origin at boatY and scale down beautifully on mobile screen sizes
        const scaleVal = w < 768 ? 0.65 : 1.0;
        boatEl.style.transform = `translate(${boatX - 160}px, ${boatY - 185}px) scale(${scaleVal}) rotate(${boatAngle}rad)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      id="generative-landscape-canvas"
      className="absolute top-0 left-0 w-full h-full object-cover block pointer-events-none" 
    />
  );
}
