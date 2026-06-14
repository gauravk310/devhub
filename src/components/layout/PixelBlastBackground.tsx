'use client'

import dynamic from 'next/dynamic'

const PixelBlast = dynamic(() => import('@/components/ui/PixelBlast'), {
  ssr: false,
})

export default function PixelBlastBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.2, pointerEvents: 'none' }}>
      <PixelBlast
        variant="circle"
        pixelSize={4}
        color="#58a6ff"
        patternScale={2.8}
        patternDensity={1.1}
        speed={0.25}
        transparent={true}
      />
    </div>
  )
}
