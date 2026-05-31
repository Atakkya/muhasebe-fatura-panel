import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  href?: string
}

export default function Logo({ size = 'md', href = '/' }: LogoProps) {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36
  const fontSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'

  return (
    <Link href={href} className="flex items-center gap-2 select-none">
      <div
        style={{
          width: iconSize,
          height: iconSize,
          background: 'linear-gradient(135deg, #2456DB, #1ABC9C)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: '#fff',
            fontFamily: 'var(--font-montserrat)',
            fontWeight: 800,
            fontSize: iconSize * 0.55,
            lineHeight: 1,
          }}
        >
          F
        </span>
      </div>
      <span
        className={`font-extrabold tracking-tight ${fontSize}`}
        style={{
          fontFamily: 'var(--font-montserrat)',
          background: 'linear-gradient(135deg, #2456DB, #1ABC9C)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Fatu
      </span>
    </Link>
  )
}
