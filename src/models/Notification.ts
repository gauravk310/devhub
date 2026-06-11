import { Schema, model, models, Document, Types } from 'mongoose'
import type { NotificationType, NotificationStatus } from '@/types'

export interface INotificationDocument extends Document {
  recipientId: Types.ObjectId
  senderId: Types.ObjectId
  type: NotificationType
  projectId: Types.ObjectId | null
  title: string
  message: string
  status: NotificationStatus
  createdAt: Date
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['PROJECT_INVITE', 'FEATURE_UPDATE', 'GENERAL'],
      required: true,
    },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['UNREAD', 'READ', 'ACCEPTED', 'DECLINED'],
      default: 'UNREAD',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

NotificationSchema.index({ recipientId: 1, createdAt: -1 })
NotificationSchema.index({ recipientId: 1, status: 1 })

const Notification =
  models.Notification ?? model<INotificationDocument>('Notification', NotificationSchema)
export default Notification
