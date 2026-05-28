import { create } from 'domain';
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            trim: true,
        },
        imageUrl: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);
messageSchema.index({ conversationId: 1, createdAt: -1 }); // sort by createdAt in descending order

const Message = mongoose.model('Message', messageSchema);

export default Message;
