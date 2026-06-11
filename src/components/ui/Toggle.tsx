'use client'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
}

export default function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', userSelect: 'none' }}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          width: '40px',
          height: '22px',
          borderRadius: '9999px',
          border: '1px solid var(--color-border-default)',
          background: checked ? 'var(--color-success-emphasis)' : 'var(--color-canvas-inset)',
          cursor: 'pointer',
          transition: 'background 0.2s ease, border-color 0.2s ease',
          outline: 'none',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '20px' : '2px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </button>
      {label && (
        <span style={{ fontSize: '0.875rem', color: 'var(--color-fg-default)' }}>{label}</span>
      )}
    </label>
  )
}
