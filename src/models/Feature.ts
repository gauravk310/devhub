import { Schema, model, models, Document, Types } from 'mongoose'
import type { FeatureStatus } from '@/types'

interface ICodebaseBranch {
  codebaseId: Types.ObjectId
  codebaseName: string
  branchName: string | null
}

export interface IFeatureDocument extends Document {
  projectId: Types.ObjectId
  name: string
  description: string
  authorId: Types.ObjectId
  codebaseBranches: ICodebaseBranch[]
  dbChange: string
  envChange: string
  status: FeatureStatus
  deploymentDate: Date | null
  createdAt: Date
  updatedAt: Date
}

const CodebaseBranchSchema = new Schema<ICodebaseBranch>({
  codebaseId: { type: Schema.Types.ObjectId, required: true },
  codebaseName: { type: String, required: true },
  branchName: { type: String, default: null },
})

const FeatureSchema = new Schema<IFeatureDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    codebaseBranches: { type: [CodebaseBranchSchema], default: [] },
    dbChange: { type: String, default: '' },
    envChange: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'READY', 'TESTING', 'DEPLOYED', 'DISCARD'],
      default: 'PENDING',
    },
    deploymentDate: { type: Date, default: null },
  },
  { timestamps: true }
)

FeatureSchema.index({ projectId: 1, createdAt: -1 })

const Feature = models.Feature ?? model<IFeatureDocument>('Feature', FeatureSchema)
export default Feature
