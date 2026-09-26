import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notification.service';

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const notifications = await getUserNotifications(req.user.userId);

  res.status(200).json({
    success: true,
    data: notifications,
  });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const unreadCount = await getUnreadNotificationCount(req.user.userId);

  res.status(200).json({
    success: true,
    data: { unreadCount },
  });
});

export const patchRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  const updated = await markNotificationAsRead(req.params.id, req.user.userId);

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Notification marked as read',
  });
});

export const postReadAll = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required.', 401);
  }

  await markAllNotificationsAsRead(req.user.userId);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

