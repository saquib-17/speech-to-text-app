/**
 * Input validation for authentication requests
 */
export const validateRegisterInput = ({ name, email, password }) => {
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long.");
  } else if (name.trim().length > 60) {
    errors.push("Name cannot exceed 60 characters.");
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    errors.push("Please provide a valid email address.");
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateLoginInput = ({ email, password }) => {
  const errors = [];

  if (!email || typeof email !== "string" || email.trim() === "") {
    errors.push("Email address is required.");
  }

  if (!password || typeof password !== "string" || password === "") {
    errors.push("Password is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

