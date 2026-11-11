import User from "../models/userModel.js";
import { signToken } from "../utils/tokenUtils.js";
import { validateRegisterInput, validateLoginInput } from "../validators/authValidator.js";

/**
 * Service: Register a new user
 */
export const registerUser = async ({ name, email, password }) => {
  const { isValid, errors } = validateRegisterInput({ name, email, password });
  if (!isValid) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check for duplicate account
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("An account with this email address already exists.");
    error.statusCode = 409;
    throw error;
  }

  // User pre-save hook handles bcrypt hashing
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  const token = signToken({ id: user._id, email: user.email });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

/**
 * Service: Authenticate existing user
 */
export const loginUser = async ({ email, password }) => {
  const { isValid, errors } = validateLoginInput({ email, password });
  if (!isValid) {
    const error = new Error(errors.join(" "));
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find user and explicitly select password field
  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  // Compare entered password with stored bcrypt hash
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = signToken({ id: user._id, email: user.email });

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
};

/**
 * Service: Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password").lean();
  if (!user) {
    const error = new Error("User profile not found.");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

