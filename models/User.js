import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    avatar: { type: String },
    role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
    language: { type: String, enum: ["en", "hi"], default: "en" },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    dateOfBirth: { type: Date },
    timeOfBirth: { type: String },
    placeOfBirth: { type: String },
    zodiacSign: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    emailVerificationToken: { type: String },
    lastLogin: { type: Date },
    scanCount: { type: Number, default: 0 },
    chatCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.emailVerificationToken;
  return obj;
};

export default mongoose.model("User", userSchema);
