import mongoose, { Schema, model, models, Document } from 'mongoose'

export interface IUserDocument extends Document {
  name: string
  email: string
  image: string
  githubUsername: string
  githubAccessToken: string
  provider: 'github' | 'google'
  createdAt: Date
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    image: { type: String, default: '' },
    githubUsername: { type: String, default: '' },
    githubAccessToken: { type: String, default: '' }, // server-side only
    provider: { type: String, enum: ['github', 'google'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Never expose the access token in JSON responses
UserSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform(_: unknown, ret: any) {
    ret.githubAccessToken = undefined
    return ret
  },
})

const User = models.User ?? model<IUserDocument>('User', UserSchema)
export default User
