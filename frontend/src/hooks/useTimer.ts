import { useState, useEffect, useRef } from 'react'

export function useTimer(durationMs: number, onExpire?: () => void) {
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const start = () => {
    startTimeRef.current = performance.now()
    setTimeLeftMs(durationMs)
    setIsRunning(true)
  }

  const stop = () => {
    setIsRunning(false)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }

  useEffect(() => {
    if (!isRunning) return
    const tick = () => {
      const elapsed = performance.now() - (startTimeRef.current ?? 0)
      const remaining = Math.max(0, durationMs - elapsed)
      setTimeLeftMs(remaining)
      if (remaining <= 0) {
        setIsRunning(false)
        onExpire?.()
        return
      }
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isRunning, durationMs, onExpire])

  const elapsedMs = durationMs - timeLeftMs
  const progress = timeLeftMs / durationMs // 1.0 → 0.0
  const isCritical = timeLeftMs < 3000 // < 3 secondes

  return { timeLeftMs, elapsedMs, progress, isCritical, isRunning, start, stop }
}
