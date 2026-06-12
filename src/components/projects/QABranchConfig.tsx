'use client'

import type { ICodebase } from '@/types'
import BranchSelector from '@/components/features/BranchSelector'

interface Props {
  codebases: ICodebase[]
  qaBranches: Record<string, string> // codebaseId -> branchName
  onChange: (codebaseId: string, branch: string) => void
}

export default function QABranchConfig({ codebases, qaBranches, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {codebases.map((cb) => {
        const id = cb._id.toString()
        return (
          <BranchSelector
            key={id}
            codebaseName={cb.name}
            repoFullName={cb.repoFullName}
            value={qaBranches[id] || null}
            onChange={(branch) => onChange(id, branch ?? '')}
          />
        )
      })}
    </div>
  )
}
