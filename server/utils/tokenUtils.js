import jwt from "jsonwebtoken";
import env from "../config/env.js";

/**
 * Signs a JWT with the user payload
 * @param {object} payload - { id, email }
 * @returns {string} - Signed JWT
 */
export const signToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verifies a JWT token
 * @param {string} token
 * @returns {object} - Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

