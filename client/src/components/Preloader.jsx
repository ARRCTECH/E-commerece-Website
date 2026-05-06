"use client"

import { useState, useEffect } from "react"

export default function Preloader({ onComplete, duration = 2000 }) {
  const [isVisible, setIsVisible] = useState(true)
  const [animationPhase, setAnimationPhase] = useState(0)
  useEffect(() => {
    const phaseTimers = [
      setTimeout(() => setAnimationPhase(1), 500), // Solid text appears
      setTimeout(() => setAnimationPhase(2), 1000), // Outlined text
      setTimeout(() => setAnimationPhase(3), 2000), // Mixed effect
      setTimeout(() => setAnimationPhase(4), 3000), // Final solid
    ]

    // Complete preloader
    const completeTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        onComplete?.()
      }, 500)
    }, duration)

    return () => {
      phaseTimers.forEach(clearTimeout)
      clearTimeout(completeTimer)
    }
  }, [duration, onComplete])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#c70505] transition-opacity duration-500 ${
        !isVisible ? "opacity-0" : ""
      }`}
    >
      <div className="relative">
        <h3
          className={`text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter select-none transition-all duration-700 ease-out ${
            animationPhase === 0
              ? "opacity-0 scale-95"
              : animationPhase === 1
                ? "opacity-100 scale-100 text-white"
                : animationPhase === 2
                  ? "opacity-100 scale-100 text-transparent"
                  : animationPhase === 3
                    ? "opacity-100 scale-100 text-white"
                    : "opacity-100 scale-100 text-white"
          }`}
          style={{
            fontFamily: "sans-serif",
            fontStretch: "condensed",
            ...(animationPhase === 2 && {
              WebkitTextStroke: "3px white",
              textStroke: "3px white",
            }),
            ...(animationPhase === 3 && {
              textShadow: "0 0 0 transparent",
            }),
          }}
        >
          {"KSAUNIBLISS".split("").map((letter, index) => (
            <span
              key={index}
              className={`inline-block transition-all duration-500 ease-out ${
                animationPhase >= 1 ? "translate-y-0" : "translate-y-8"
              } ${animationPhase === 3 && index % 2 === 0 ? "text-transparent" : ""}`}
              style={{
                transitionDelay: `${index * 80}ms`,
                ...(animationPhase === 3 &&
                  index % 2 === 0 && {
                    WebkitTextStroke: "3px white",
                    textStroke: "3px white",
                  }),
              }}
            >
              {letter}
            </span>
          ))}
        </h3>

        <div
          className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 transition-opacity duration-500 ${
            animationPhase >= 2 ? "opacity-100" : "opacity-0"
          }`}
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-white rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
