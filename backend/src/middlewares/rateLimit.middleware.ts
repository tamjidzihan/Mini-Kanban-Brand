import rateLimit from 'express-rate-limit';

const createLimiter = (limit: number, message: string) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

export const loginRateLimit = createLimiter(
  10,
  'Too many sign-in attempts. Please try again in 15 minutes.'
);

export const registrationRateLimit = createLimiter(
  5,
  'Too many account creation attempts. Please try again in 15 minutes.'
);

export const passwordChangeRateLimit = createLimiter(
  5,
  'Too many password change attempts. Please try again in 15 minutes.'
);
