"use client";

import { useEffect, useRef, useState } from "react";

export default function InteractiveEyes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPos = (eyeRect: DOMRect) => {
    if (!eyeRect) return { x: 0, y: 0 };

    const eyeCenterX = eyeRect.left + eyeRect.width / 2;
    const eyeCenterY = eyeRect.top + eyeRect.height / 2;

    const angle = Math.atan2(mousePos.y - eyeCenterY, mousePos.x - eyeCenterX);
    const distance = Math.min(
      eyeRect.width / 4,
      Math.hypot(mousePos.x - eyeCenterX, mousePos.y - eyeCenterY) / 10
    );

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  };

  const [pupil1Pos, setPupil1Pos] = useState({ x: 0, y: 0 });
  const [pupil2Pos, setPupil2Pos] = useState({ x: 0, y: 0 });
  const eye1Ref = useRef<HTMLDivElement>(null);
  const eye2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eye1Ref.current) {
      setPupil1Pos(calculatePupilPos(eye1Ref.current.getBoundingClientRect()));
    }
    if (eye2Ref.current) {
      setPupil2Pos(calculatePupilPos(eye2Ref.current.getBoundingClientRect()));
    }
  }, [mousePos]);

  return (
    <div ref={containerRef} className="flex gap-8 justify-center mb-8 pointer-events-none select-none">
      {/* Eye 1 */}
      <div
        ref={eye1Ref}
        className="w-20 h-24 bg-gradient-to-br from-white via-blue-50 to-cyan-50 rounded-3xl flex items-center justify-center overflow-hidden relative border-2 border-white shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300"
      >
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-200/20 rounded-3xl"></div>

        <div
          className="w-8 h-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full absolute transition-transform duration-150 ease-out shadow-lg"
          style={{ transform: `translate(${pupil1Pos.x * 0.8}px, ${pupil1Pos.y * 1.5}px)` }}
        />
        {/* Reflection */}
        <div className="w-3 h-3 bg-white rounded-full absolute top-4 left-5 z-10 opacity-80 transition-transform duration-150 ease-out shadow-sm"
          style={{ transform: `translate(${pupil1Pos.x * 0.8}px, ${pupil1Pos.y * 1.5}px)` }}
        />
      </div>

      {/* Eye 2 */}
      <div
        ref={eye2Ref}
        className="w-20 h-24 bg-gradient-to-br from-white via-blue-50 to-cyan-50 rounded-3xl flex items-center justify-center overflow-hidden relative border-2 border-white shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300"
      >
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-200/20 rounded-3xl"></div>

        <div
          className="w-8 h-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full absolute transition-transform duration-150 ease-out shadow-lg"
          style={{ transform: `translate(${pupil2Pos.x * 0.8}px, ${pupil2Pos.y * 1.5}px)` }}
        />
        {/* Reflection */}
        <div className="w-3 h-3 bg-white rounded-full absolute top-4 left-5 z-10 opacity-80 transition-transform duration-150 ease-out shadow-sm"
          style={{ transform: `translate(${pupil2Pos.x * 0.8}px, ${pupil2Pos.y * 1.5}px)` }}
        />
      </div>
    </div>
  );
}
