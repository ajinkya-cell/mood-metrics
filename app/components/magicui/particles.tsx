"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ParticlesProps {
  className?: string;
  quantity?: number;
  color?: string;
  refresh?: boolean;
}

export function Particles({
  className,
  quantity = 30,
  color = "#ffffff",
  refresh = false,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<any[]>([]);
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }
    initCanvas();
    animate();
    window.addEventListener("resize", initCanvas);

    return () => {
      window.removeEventListener("resize", initCanvas);
    };
  }, []);

  useEffect(() => {
    initCanvas();
  }, [refresh]);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current = [];
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  };

  type Circle = {
    x: number;
    y: number;
    size: number;
    alpha: number;
    targetAlpha: number;
    dx: number;
    dy: number;
  };

  const circleParams = (): Circle => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const size = Math.random() * 2 + 0.1;
    const alpha = 0;
    const targetAlpha = Math.random() * 0.6 + 0.1;
    const dx = (Math.random() - 0.5) * 0.15;
    const dy = (Math.random() - 0.5) * 0.15;
    return {
      x,
      y,
      size,
      alpha,
      targetAlpha,
      dx,
      dy,
    };
  };

  const rgb = hexToRgb(color);

  const drawCircle = (circle: Circle, update = false) => {
    if (context.current) {
      const { x, y, size, alpha } = circle;
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = rgb
        ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`;
      context.current.fill();

      if (!update) {
        circles.current.push(circle);
      }
    }
  };

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h
      );
    }
  };

  const drawParticles = () => {
    clearContext();
    const particleCount = quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
  };

  const remapValue = (
    value: number,
    start1: number,
    stop1: number,
    start2: number,
    stop2: number
  ): number => {
    const outgoing =
      start2 + ((stop2 - start2) * (value - start1)) / (stop1 - start1);
    return outgoing;
  };

  const animate = () => {
    clearContext();
    circles.current.forEach((circle: Circle, i: number) => {
      // Easing alpha near edges
      const edge = [
        circle.x - circle.size, // left
        canvasSize.current.w - circle.x - circle.size, // right
        circle.y - circle.size, // top
        canvasSize.current.h - circle.y - circle.size, // bottom
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = remapValue(closestEdge, 0, 20, 0, 1).toFixed(2);
      
      if (parseFloat(remapClosestEdge) < 1) {
        circle.alpha = circle.targetAlpha * parseFloat(remapClosestEdge);
      } else {
        circle.alpha = circle.targetAlpha;
      }

      // Float naturally
      circle.x += circle.dx;
      circle.y += circle.dy;

      // Bounce limits
      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        // replace circle
        circles.current[i] = circleParams();
        circles.current[i].alpha = 0;
      } else {
        drawCircle(circle, true);
      }
    });
    requestAnimationFrame(animate);
  };

  return (
    <div
      ref={canvasContainerRef}
      className={cn("absolute inset-0 z-0 h-full w-full", className)}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
    </div>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
