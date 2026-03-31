let mongoose = require("mongoose");
let bcrypt = require('bcrypt')

let userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true
    },

    password: {
      type: String,
      required: [true, "Password is required"]
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },

    name: {
      type: String,
      default: ""
    },

    phone: {
      type: String,
      default: ""
    },

    avatar: {
      type: String,
      default: "https://i.sstatic.net/l60Hf.png"
    },

    active: {
      type: Boolean,
      default: true
    },

    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER'],
      default: 'CUSTOMER'
    },

    loginCount: {
      type: Number,
      default: 0,
      min: [0, "Login count cannot be negative"]
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    forgotPasswordToken: {
      type: String
    },
    forgotPasswordTokenExp: {
      type: Date
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("user", userSchema);