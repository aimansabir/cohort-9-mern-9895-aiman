import type { RequestHandler } from 'express';

import { requireAuthenticatedUser } from '../middleware/authenticate';
import { getUserProfile, logIn, signUp } from '../services/authService';
import { loginSchema, signupSchema } from '../validation/authSchemas';
import { parseBody } from '../validation/parseBody';

export const postSignup: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const result = await signUp(req.log, parseBody(signupSchema, req.body));
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const postLogin: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const result = await logIn(req.log, parseBody(loginSchema, req.body));
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { id } = requireAuthenticatedUser(req);
    const user = await getUserProfile(req.log, id);
    res.status(200).json({
      success: true,
      message: 'Current user retrieved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// stateless JWT — there's no server-side session to destroy,
// the client just needs to delete its token
export const postLogout: RequestHandler = (req, res, next): void => {
  try {
    const { id } = requireAuthenticatedUser(req);
    req.log.info({ userId: id }, 'User logged out');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
