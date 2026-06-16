import { Schema, model, models, Document, Types } from 'mongoose'

interface ICodebase {
  _id: Types.ObjectId
  name: string
  repoFullName: string
  repoId: number
}

interface IQABranch {
  codebaseId: Types.ObjectId
  branchName: string
}

export interface IProjectDocument extends Document {
  name: string
  domain: string
  projectId?: string
  ownerId: Types.ObjectId
  codebases: ICodebase[]
  hasQA: boolean
  qaBranches: IQABranch[]
  members: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const CodebaseSchema = new Schema<ICodebase>({
  name: { type: String, required: true, trim: true },
  repoFullName: { type: String, required: true },
  repoId: { type: Number, required: true },
})

const QABranchSchema = new Schema<IQABranch>({
  codebaseId: { type: Schema.Types.ObjectId, required: true },
  branchName: { type: String, required: true },
})

const ProjectSchema = new Schema<IProjectDocument>(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, default: '', trim: true },
    projectId: { type: String, unique: true, index: true, sparse: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    codebases: { type: [CodebaseSchema], default: [] },
    hasQA: { type: Boolean, default: false },
    qaBranches: { type: [QABranchSchema], default: [] },
    members: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  },
  { timestamps: true }
)

// Compound index: find all projects for a member
ProjectSchema.index({ members: 1, createdAt: -1 })

const Project = models.Project ?? model<IProjectDocument>('Project', ProjectSchema)
export default Project
