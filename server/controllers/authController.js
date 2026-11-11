import { registerUser, loginUser } from "../services/authService.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * Controller: Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser({ name, email, password });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "User registered successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Authenticate existing user
 * @route POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });

    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get authenticated user profile
 * @route GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      statusCode: HTTP_STATUS.OK,
      message: "User profile retrieved.",
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

