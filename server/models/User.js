const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    notificationInstallations: [
      {
        fid: {
          type: String,
          required: true,
        },

        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.email;
        delete ret.password;
        delete ret.notificationInstallations;
        return ret;
      },
    },
  }
);

module.exports =
  mongoose.model("User", userSchema);
