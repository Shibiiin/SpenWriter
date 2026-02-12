import { cn } from '@/lib/utils'

interface AudioOrbProps {
  isActive: boolean
  isProcessing?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export function AudioOrb({ isActive, isProcessing, size = 'md', onClick }: AudioOrbProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer',
        sizeClasses[size],
        isActive
          ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/50'
          : 'bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600',
        isProcessing && 'opacity-75'
      )}
      aria-label={isActive ? 'Stop recording' : 'Start recording'}
    >
      {/* Pulse rings */}
      {isActive && (
        <>
          <span className="absolute inset-0 rounded-full animate-ping bg-violet-400/30" />
          <span
            className="absolute rounded-full bg-violet-400/20"
            style={{
              inset: '-12px',
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
              animationDelay: '0.5s',
            }}
          />
        </>
      )}

      {/* Processing spinner */}
      {isProcessing && (
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
      )}

      {/* Inner orb */}
      <span
        className={cn(
          'rounded-full transition-all duration-300',
          size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-16 h-16' : 'w-20 h-20',
          isActive
            ? 'bg-gradient-to-br from-violet-300 to-fuchsia-300 shadow-inner'
            : 'bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-400 dark:to-slate-500'
        )}
      />
    </button>
  )
}
