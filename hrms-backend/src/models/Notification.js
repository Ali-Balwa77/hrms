import mongoose from "mongoose";

const notificationRecipientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    recipients: {
      type: [notificationRecipientSchema],
      default: [],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one notification recipient is required",
      },
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    message: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      trim: true,
      required: true,
    },

    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ "recipients.userId": 1, createdAt: -1 });
notificationSchema.index({
  "recipients.userId": 1,
  "recipients.isRead": 1,
  createdAt: -1,
});
notificationSchema.index({ linkId: 1, type: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
