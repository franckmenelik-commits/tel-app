'use client'

interface ConfidenceBarProps {
  value: number // 0–100
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ConfidenceBar({
  value,
  label,
  showValue = true,
  size = 'md',
}: ConfidenceBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  // Color: low = amber-red, mid = gold, high = green
  const getColor = (v: number) => {
    if (v >= 75) return '#1A6B3C'
    if (v >= 50) return '#C9A84C'
    if (v >= 25) return '#b87333'
    return '#8B3A3A'
  }

  const heightClass = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2'

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: '#555555', fontFamily: 'ui-monospace, monospace' }}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span
              className="text-xs font-mono ml-auto"
              style={{ color: getColor(clamped) }}
            >
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full ${heightClass} rounded-full overflow-hidden`}
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${getColor(clamped)}88, ${getColor(clamped)})`,
            boxShadow: `0 0 8px ${getColor(clamped)}66`,
          }}
        />
      </div>
    </div>
  )
}
