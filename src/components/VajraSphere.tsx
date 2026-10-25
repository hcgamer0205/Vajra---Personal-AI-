import React, { useEffect, useRef } from 'react';
import { AssistantState } from '../types';
import { CoreThemeId } from '../services/vajraAppearance';

export interface VajraSphereProps {
  state?: AssistantState;
  isOffline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero' | 'massive' | 'colossal' | 'ambient';
  interactive?: boolean;
  className?: string;
  showRings?: boolean;
  onClick?: () => void;
  coreTheme?: CoreThemeId;
  customCoreColor?: string;
  customDimension?: number;
  audioAmplitude?: number;
}

export const VajraSphere: React.FC<VajraSphereProps> = ({
  state = 'idle',
  isOffline = false,
  size = 'hero',
  interactive = true,
  className = '',
  showRings = true,
  onClick,
  coreTheme = 'crimson_gold',
  customCoreColor = '#f59e0b',
  customDimension,
  audioAmplitude = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute base dimension
  const dimension =
    customDimension ||
    (size === 'sm'
      ? 52
      : size === 'md'
      ? 110
      : size === 'lg'
      ? 200
      : size === 'hero'
      ? 340
      : size === 'colossal'
      ? 480
      : 400);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina / High-DPI Display Scaling
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = dimension * dpr;
    canvas.height = dimension * dpr;
    ctx.scale(dpr, dpr);

    let animationFrameId: number;
    let angle = 0;
    let pulseAngle = 0;
    let bootProgress = 0; // 0 to 1 smooth power-up sequence
    let scanAngle = 0;

    // Mobile / Low power detection
    const isMobileScreen =
      typeof window !== 'undefined' &&
      (window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 40 Circumferential drifting embers/particles
    const particleCount = size === 'sm' ? 8 : isMobileScreen ? 28 : 42;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      orbitRadiusRatio: 0.68 + (i % 7) * 0.045 + Math.random() * 0.04,
      speed: (0.003 + (i % 5) * 0.002) * (i % 2 === 0 ? 1 : -1),
      theta: (i / particleCount) * Math.PI * 2 + Math.random() * 0.5,
      size: 1.0 + (i % 3) * 0.6,
      baseAlpha: 0.35 + Math.random() * 0.55,
      isSpark: i % 6 === 0,
    }));

    // 8 Strategic Energy Nodes
    const energyNodes = [
      { angle: 0, rRatio: 0.76, isCyan: false, baseFlare: 0.6 },
      { angle: Math.PI * 0.25, rRatio: 0.64, isCyan: false, baseFlare: 0.8 },
      { angle: Math.PI * 0.5, rRatio: 0.76, isCyan: false, baseFlare: 0.5 },
      { angle: Math.PI * 0.75, rRatio: 0.64, isCyan: true, baseFlare: 0.9 },
      { angle: Math.PI, rRatio: 0.76, isCyan: true, baseFlare: 0.7 },
      { angle: Math.PI * 1.25, rRatio: 0.64, isCyan: true, baseFlare: 0.85 },
      { angle: Math.PI * 1.5, rRatio: 0.76, isCyan: true, baseFlare: 0.5 },
      { angle: Math.PI * 1.75, rRatio: 0.64, isCyan: false, baseFlare: 0.75 },
    ];

    // Backgrounded / visibility listener to pause loop
    let isHidden = typeof document !== 'undefined' && document.hidden;
    const handleVisibilityChange = () => {
      isHidden = document.hidden;
      if (!isHidden) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (isHidden) return;

      ctx.clearRect(0, 0, dimension, dimension);
      const cx = dimension / 2;
      const cy = dimension / 2;
      const R = (dimension / 2) * 0.94; // Maximum outer boundary

      // Smooth Power-Up / Ignition progress (0 -> 1 over 800ms)
      if (bootProgress < 1) {
        bootProgress = Math.min(bootProgress + 0.035, 1);
      }

      // State-driven dynamics
      let speedMultiplier = 1.0;
      let amplitudeBoost = 0;
      let stateHueAmber = '#f59e0b';
      let stateHueAmberBright = '#fbbf24';
      let stateHueCyan = '#00f3ff';
      let stateHueCyanBright = '#e0f2fe';

      if (prefersReducedMotion) {
        speedMultiplier = 0.25;
      } else {
        switch (state) {
          case 'listening':
            speedMultiplier = 1.6;
            amplitudeBoost = Math.max(audioAmplitude * 1.2, 0.15);
            stateHueCyan = '#00f3ff';
            stateHueCyanBright = '#ffffff';
            break;
          case 'thinking':
          case 'planning':
            speedMultiplier = 2.8;
            stateHueAmber = '#fbbf24';
            stateHueCyan = '#38bdf8';
            break;
          case 'speaking':
            speedMultiplier = 1.5;
            amplitudeBoost = Math.max(audioAmplitude * 1.0, 0.2);
            break;
          case 'executing':
            speedMultiplier = 3.2;
            stateHueAmber = '#ea580c';
            stateHueAmberBright = '#ef4444';
            break;
          case 'awaiting_confirmation':
          case 'protected':
            speedMultiplier = 1.2;
            stateHueAmber = '#f59e0b';
            stateHueAmberBright = '#fbbf24';
            break;
          case 'error':
            speedMultiplier = 0.8;
            stateHueAmber = '#dc2626';
            stateHueAmberBright = '#ef4444';
            break;
          case 'paused':
          case 'backgrounded':
            speedMultiplier = 0.2;
            break;
          case 'idle':
          default:
            speedMultiplier = 0.75;
            break;
        }
      }

      angle += 0.009 * speedMultiplier;
      pulseAngle += 0.035 * speedMultiplier;
      scanAngle += 0.024 * speedMultiplier;

      const breathingPulse = Math.sin(pulseAngle) * 0.035 + amplitudeBoost * 0.08;
      const effectiveR = R * (1 + breathingPulse) * bootProgress;

      ctx.save();
      ctx.translate(cx, cy);

      // -------------------------------------------------------------
      // LAYER 0: Pure Deep Space Radial Vignette & Atmospheric Bloom
      // -------------------------------------------------------------
      const bgRadial = ctx.createRadialGradient(0, 0, 0, 0, 0, effectiveR * 1.05);
      bgRadial.addColorStop(0, 'rgba(0, 243, 255, 0.06)');
      bgRadial.addColorStop(0.35, 'rgba(2, 6, 23, 0.15)');
      bgRadial.addColorStop(0.7, 'rgba(245, 158, 11, 0.03)');
      bgRadial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgRadial;
      ctx.beginPath();
      ctx.arc(0, 0, effectiveR * 1.05, 0, Math.PI * 2);
      ctx.fill();

      if (showRings && size !== 'sm') {
        // -------------------------------------------------------------
        // LAYER 1: Hairline Precision Polar Grid Reticle & Crosshairs
        // -------------------------------------------------------------
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.lineWidth = 0.6;
        ctx.setLineDash([2, 8]);

        // Cardinal axes with micro-notches
        ctx.beginPath();
        ctx.moveTo(-effectiveR * 0.95, 0); ctx.lineTo(-effectiveR * 0.18, 0);
        ctx.moveTo(effectiveR * 0.18, 0); ctx.lineTo(effectiveR * 0.95, 0);
        ctx.moveTo(0, -effectiveR * 0.95); ctx.lineTo(0, -effectiveR * 0.18);
        ctx.moveTo(0, effectiveR * 0.18); ctx.lineTo(0, effectiveR * 0.95);
        ctx.stroke();

        // 45° Diagonal Alignment Rays
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.14)';
        ctx.setLineDash([1, 10]);
        const diagR1 = effectiveR * 0.28;
        const diagR2 = effectiveR * 0.88;
        const cos45 = Math.SQRT1_2;
        ctx.beginPath();
        ctx.moveTo(-diagR2 * cos45, -diagR2 * cos45); ctx.lineTo(-diagR1 * cos45, -diagR1 * cos45);
        ctx.moveTo(diagR1 * cos45, diagR1 * cos45); ctx.lineTo(diagR2 * cos45, diagR2 * cos45);
        ctx.moveTo(-diagR2 * cos45, diagR2 * cos45); ctx.lineTo(-diagR1 * cos45, diagR1 * cos45);
        ctx.moveTo(diagR1 * cos45, -diagR1 * cos45); ctx.lineTo(diagR2 * cos45, -diagR2 * cos45);
        ctx.stroke();
        ctx.setLineDash([]);

        // -------------------------------------------------------------
        // LAYER 2: Outermost Millimeter Bounding Track & Technical Ruler
        // -------------------------------------------------------------
        const rOuter = effectiveR * 0.92;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
        ctx.stroke();

        // Dual Track Outer Rail
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, rOuter * 0.97, 0, Math.PI * 2);
        ctx.stroke();

        // 72 Precision Circumferential Ruler Ticks
        for (let i = 0; i < 72; i++) {
          const tAngle = (i / 72) * Math.PI * 2 - angle * 0.05;
          const isMajor = i % 9 === 0;
          const isMedium = i % 3 === 0;
          const tickLen = isMajor ? 6.5 : isMedium ? 4.0 : 2.0;

          // Asymmetric coloring: Left quadrant cyan, right quadrant amber
          const isLeft = Math.cos(tAngle) < 0;
          ctx.strokeStyle = isLeft
            ? isMajor
              ? 'rgba(0, 243, 255, 0.85)'
              : 'rgba(56, 189, 248, 0.45)'
            : isMajor
            ? 'rgba(251, 191, 36, 0.9)'
            : 'rgba(245, 158, 11, 0.45)';
          ctx.lineWidth = isMajor ? 1.2 : 0.6;

          const rStart = rOuter - tickLen;
          ctx.beginPath();
          ctx.moveTo(Math.cos(tAngle) * rStart, Math.sin(tAngle) * rStart);
          ctx.lineTo(Math.cos(tAngle) * rOuter, Math.sin(tAngle) * rOuter);
          ctx.stroke();
        }

        // 4 Outer Corner Technical Registration Brackets
        const bracketR = effectiveR * 0.95;
        for (let b = 0; b < 4; b++) {
          const bAngle = (b * Math.PI) / 2 + Math.PI / 4;
          const bx = Math.cos(bAngle) * bracketR;
          const by = Math.sin(bAngle) * bracketR;
          ctx.strokeStyle = b === 1 || b === 2 ? 'rgba(0, 243, 255, 0.7)' : 'rgba(245, 158, 11, 0.7)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(bx, by, 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // -------------------------------------------------------------
        // LAYER 3: Counter-Rotating Gyroscopic Gimbal & Orbital Guide Rails
        // -------------------------------------------------------------
        const rGyro1 = effectiveR * 0.78;
        const rGyro2 = effectiveR * 0.71;

        // Gyro Rail 1 (Clockwise Segmented Arc)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([14, 8, 4, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, rGyro1, angle * 0.4, angle * 0.4 + Math.PI * 1.85);
        ctx.stroke();

        // Gyro Rail 2 (Counter-Clockwise Segmented Arc)
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.7)';
        ctx.lineWidth = 1.0;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, rGyro2, -angle * 0.65, -angle * 0.65 + Math.PI * 1.9);
        ctx.stroke();
        ctx.setLineDash([]);

        // -------------------------------------------------------------
        // LAYER 4: The 10-Segment Mechanical Stator Arc Reactor
        // (Featuring Sequential Illuminating Traveling Power Waves)
        // -------------------------------------------------------------
        const rStatorOuter = effectiveR * 0.64;
        const rStatorInner = effectiveR * 0.52;
        const statorCount = 10;
        const waveAngle = (angle * 2.5) % (Math.PI * 2);

        for (let s = 0; s < statorCount; s++) {
          const segBaseAngle = (s / statorCount) * Math.PI * 2 + angle * 0.15;
          const segSpan = (Math.PI * 2) / statorCount - 0.12;
          const segMid = segBaseAngle + segSpan / 2;

          // Compute proximity to circular traveling activation wave
          let dist = Math.abs(segMid - waveAngle);
          if (dist > Math.PI) dist = Math.PI * 2 - dist;
          const waveGlow = Math.max(0, 1 - dist / 1.2);

          // Asymmetric hemispheric color: Left blocks cyan, right blocks amber
          const isLeftBlock = Math.cos(segMid) < 0;
          const baseColor = isLeftBlock ? stateHueCyan : stateHueAmber;
          const brightColor = isLeftBlock ? stateHueCyanBright : stateHueAmberBright;

          // Main Curved Stator Arc Plate
          ctx.beginPath();
          ctx.arc(0, 0, rStatorOuter, segBaseAngle, segBaseAngle + segSpan);
          ctx.arc(0, 0, rStatorInner, segBaseAngle + segSpan, segBaseAngle, true);
          ctx.closePath();

          ctx.fillStyle = waveGlow > 0.4
            ? (isLeftBlock ? `rgba(0, 243, 255, ${0.18 + waveGlow * 0.28})` : `rgba(245, 158, 11, ${0.18 + waveGlow * 0.28})`)
            : 'rgba(15, 23, 42, 0.45)';
          ctx.fill();

          ctx.strokeStyle = waveGlow > 0.5 ? brightColor : baseColor;
          ctx.lineWidth = waveGlow > 0.5 ? 1.6 : 0.9;
          ctx.stroke();

          // 3 Micro Stator Teeth on each block
          for (let t = 1; t <= 3; t++) {
            const toothAngle = segBaseAngle + (segSpan * t) / 4;
            ctx.strokeStyle = waveGlow > 0.3 ? brightColor : 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(Math.cos(toothAngle) * rStatorInner, Math.sin(toothAngle) * rStatorInner);
            ctx.lineTo(Math.cos(toothAngle) * (rStatorInner + 5), Math.sin(toothAngle) * (rStatorInner + 5));
            ctx.stroke();
          }
        }

        // -------------------------------------------------------------
        // LAYER 5: Sub-Orbital Degree Index & Telemetry Glyphs
        // -------------------------------------------------------------
        const rIndex = effectiveR * 0.44;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, rIndex, 0, Math.PI * 2);
        ctx.stroke();

        // Fine 48-Tick Degree Calibrator
        for (let k = 0; k < 48; k++) {
          const kAngle = (k / 48) * Math.PI * 2 - angle * 0.3;
          const kLen = k % 4 === 0 ? 5 : 2.5;
          const isLeftK = Math.cos(kAngle) < 0;
          ctx.strokeStyle = isLeftK ? 'rgba(0, 243, 255, 0.5)' : 'rgba(251, 191, 36, 0.5)';
          ctx.lineWidth = k % 4 === 0 ? 1.0 : 0.5;
          ctx.beginPath();
          ctx.moveTo(Math.cos(kAngle) * (rIndex - kLen), Math.sin(kAngle) * (rIndex - kLen));
          ctx.lineTo(Math.cos(kAngle) * rIndex, Math.sin(kAngle) * rIndex);
          ctx.stroke();
        }

        // -------------------------------------------------------------
        // LAYER 6: Inner Cyan Traveling Comet Wave & High-Frequency Ring
        // -------------------------------------------------------------
        const rInnerWave = effectiveR * 0.34;
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        // Traveling bright comet arc
        const cometHead = angle * 2.2;
        ctx.arc(0, 0, rInnerWave, cometHead - 0.75, cometHead);
        ctx.stroke();

        // Counter-rotating Inner Cyan Dotted Track
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 0.9;
        ctx.setLineDash([3, 7]);
        ctx.beginPath();
        ctx.arc(0, 0, effectiveR * 0.28, -angle * 0.9, -angle * 0.9 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // -------------------------------------------------------------
        // LAYER 7: Thin Radial Laser Scanner Sweep Line
        // -------------------------------------------------------------
        const scanR = effectiveR * 0.91;
        const scanGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, scanR);
        scanGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        scanGrad.addColorStop(0.3, 'rgba(0, 243, 255, 0.75)');
        scanGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.4)');
        scanGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.save();
        ctx.rotate(scanAngle);
        // Phosphor sweep fan-trail
        const sweepTrail = ctx.createLinearGradient(0, 0, 0, -scanR * 0.3);
        sweepTrail.addColorStop(0, 'rgba(0, 243, 255, 0.12)');
        sweepTrail.addColorStop(1, 'rgba(0, 243, 255, 0)');
        ctx.fillStyle = sweepTrail;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, scanR, -0.4, 0);
        ctx.closePath();
        ctx.fill();

        // Laser beam line
        ctx.strokeStyle = scanGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(scanR, 0);
        ctx.stroke();
        ctx.restore();

        // -------------------------------------------------------------
        // LAYER 8: Glowing White-Cyan & Amber Energy Flare Nodes
        // -------------------------------------------------------------
        energyNodes.forEach((node, idx) => {
          const nAngle = node.angle + (idx % 2 === 0 ? angle * 0.15 : -angle * 0.1);
          const nr = effectiveR * node.rRatio;
          const nx = Math.cos(nAngle) * nr;
          const ny = Math.sin(nAngle) * nr;

          // Organic flaring cycle with amplitude reaction
          const flare =
            node.baseFlare * (0.6 + Math.sin(pulseAngle * 1.8 + idx * 1.1) * 0.4) + amplitudeBoost * 0.5;

          // Outer halo
          const nodeGlow = ctx.createRadialGradient(nx, ny, 0, nx, ny, 8 * flare);
          nodeGlow.addColorStop(0, '#ffffff');
          nodeGlow.addColorStop(
            0.35,
            node.isCyan ? 'rgba(0, 243, 255, 0.9)' : 'rgba(251, 191, 36, 0.9)'
          );
          nodeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = nodeGlow;
          ctx.beginPath();
          ctx.arc(nx, ny, 8 * flare, 0, Math.PI * 2);
          ctx.fill();

          // Crisp Core Pinpoint
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(nx, ny, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // 4-Point Star Lens Flare Spikes on intense flare
          if (flare > 0.75) {
            ctx.strokeStyle = node.isCyan ? 'rgba(255, 255, 255, 0.85)' : 'rgba(254, 240, 138, 0.85)';
            ctx.lineWidth = 0.6;
            const spikeLen = 7.0 * flare;
            ctx.beginPath();
            ctx.moveTo(nx - spikeLen, ny); ctx.lineTo(nx + spikeLen, ny);
            ctx.moveTo(nx, ny - spikeLen); ctx.lineTo(nx, ny + spikeLen);
            ctx.stroke();
          }
        });

        // -------------------------------------------------------------
        // LAYER 9: Circumferential Drifting Embers & Sparks
        // -------------------------------------------------------------
        particles.forEach((p) => {
          p.theta += p.speed * speedMultiplier;
          const pr = effectiveR * p.orbitRadiusRatio;
          const px = Math.cos(p.theta) * pr;
          const py = Math.sin(p.theta) * pr;
          const isLeftP = px < 0;

          ctx.fillStyle = p.isSpark
            ? '#ffffff'
            : isLeftP
            ? 'rgba(0, 243, 255, 0.75)'
            : 'rgba(251, 191, 36, 0.75)';

          ctx.beginPath();
          ctx.arc(px, py, p.size * (1 + amplitudeBoost * 0.5), 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // -------------------------------------------------------------
      // LAYER 10: Central Singularity & 6-Blade Holographic Aperture Core
      // -------------------------------------------------------------
      const coreR = effectiveR * (size === 'sm' ? 0.7 : 0.19);

      // Rotating Aperture Blades
      if (size !== 'sm') {
        const apertureAngle = angle * 0.5;
        const bladeCount = 6;
        for (let b = 0; b < bladeCount; b++) {
          const bRad = (b / bladeCount) * Math.PI * 2 + apertureAngle;
          ctx.strokeStyle = 'rgba(0, 243, 255, 0.65)';
          ctx.lineWidth = 0.9;
          const x1 = Math.cos(bRad) * (coreR * 0.45);
          const y1 = Math.sin(bRad) * (coreR * 0.45);
          const x2 = Math.cos(bRad + 0.55) * (coreR * 1.15);
          const y2 = Math.sin(bRad + 0.55) * (coreR * 1.15);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Deep Central Arc Reactor Singularity (White-hot nucleus with cyan/amber corona)
      const coreGrad = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        coreR * (1.1 + amplitudeBoost * 0.4)
      );

      if (state === 'awaiting_confirmation' || state === 'protected') {
        // Distinct amber-gold containment pattern
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.25, '#fbbf24');
        coreGrad.addColorStop(0.65, '#d97706');
        coreGrad.addColorStop(0.9, 'rgba(120, 53, 15, 0.5)');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (state === 'executing') {
        // High-voltage amber-red power drive
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.2, '#fef08a');
        coreGrad.addColorStop(0.5, '#ea580c');
        coreGrad.addColorStop(0.8, '#dc2626');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (state === 'error') {
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.25, '#f87171');
        coreGrad.addColorStop(0.65, '#dc2626');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (state === 'listening' || state === 'speaking') {
        // Brilliant electric cyan/white active voice resonance
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.2, '#cffafe');
        coreGrad.addColorStop(0.5, '#00f3ff');
        coreGrad.addColorStop(0.8, '#0284c7');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        // Default iconic dual Stark Arc Reactor baseline
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.22, 'rgba(224, 242, 254, 0.95)');
        coreGrad.addColorStop(0.48, 'rgba(0, 243, 255, 0.85)');
        coreGrad.addColorStop(0.78, 'rgba(245, 158, 11, 0.6)');
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, coreR * (1.1 + amplitudeBoost * 0.4), 0, Math.PI * 2);
      ctx.fill();

      // Precision Inner Bezel Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, coreR * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimension, state, isOffline, size, showRings, coreTheme, customCoreColor, audioAmplitude]);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center select-none bg-black ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      {/* Subtle Atmospheric Cyan/Amber Glow Halo */}
      <div
        className={`absolute inset-0 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          state === 'listening'
            ? 'opacity-70 bg-gradient-to-r from-cyan-500/25 to-blue-600/15'
            : state === 'speaking'
            ? 'opacity-80 bg-gradient-to-r from-cyan-400/20 to-amber-500/20'
            : state === 'executing'
            ? 'opacity-75 bg-gradient-to-r from-amber-500/25 to-red-600/20'
            : state === 'thinking' || state === 'planning'
            ? 'opacity-70 bg-gradient-to-r from-cyan-400/20 to-yellow-500/20 animate-pulse'
            : state === 'awaiting_confirmation'
            ? 'opacity-80 bg-gradient-to-r from-amber-500/30 to-yellow-600/20 animate-pulse'
            : 'opacity-40 bg-gradient-to-r from-cyan-950/20 to-amber-950/15'
        }`}
      />

      <canvas
        ref={canvasRef}
        style={{ width: dimension, height: dimension }}
        className="relative z-10 block pointer-events-none"
      />
    </div>
  );
};
