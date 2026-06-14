import { Schema, model, models, Document, Types } from 'mongoose'

export interface IDatabaseDocument extends Document {
  name: string
  type: string
  connectionUri: string
  databaseName: string
  ownerId: Types.ObjectId
  projectId: Types.ObjectId
  status: 'Connected' | 'Disconnected' | 'Error'
  errorMessage?: string
  lastChecked: Date
  createdAt: Date
  updatedAt: Date
}

const DatabaseSchema = new Schema<IDatabaseDocument>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['mongodb'], default: 'mongodb', required: true },
    connectionUri: { type: String, required: true },
    databaseName: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    status: { type: String, enum: ['Connected', 'Disconnected', 'Error'], default: 'Disconnected' },
    errorMessage: { type: String, default: '' },
    lastChecked: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// Compound index: query databases by project
DatabaseSchema.index({ projectId: 1, createdAt: -1 })

// Prevent sending the encrypted connection string to the client under any circumstances
DatabaseSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_: unknown, ret: any) {
    ret.connectionUri = undefined
    return ret
  },
})

const Database = models.Database ?? model<IDatabaseDocument>('Database', DatabaseSchema)
export default Database
