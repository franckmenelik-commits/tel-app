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

  const getColor = (v: number) => {
    if (v >= 75) return '#1A6B3C'
    if (v >= 50) return '#C9A84C'
    if (v >= 25) return '#b87333'
    return '#8B3A3A'
  }

  // All bars: 2px height (flat, minimal)
  const height = size === 'sm' ? '1px' : '2px'

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e0e0e0', opacity: 0.4 }}>
              {label}
            </span>
          )}
          {showValue && (
            <span style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', color: getColor(clamped), marginLeft: 'auto' }}>
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        style={{ width: '100%', height, background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}
      >
        <div
          style={{
            height: '100%',
            width: `${clamped}%`,
            background: getColor(clamped),
            transition: 'width 800ms ease-out',
          }}
        />
      </div>
    </div>
  )
}
