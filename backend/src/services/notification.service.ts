import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { mockStore, isDbConnectionError, MockNotification } from '../mock/mockStore';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        link,
        read: false,
      },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const newNotif: MockNotification = {
        id: `notif-${Date.now()}`,
        userId,
        title,
        message,
        link,
        read: false,
        createdAt: new Date(),
      };
      mockStore.notifications.unshift(newNotif);
      return newNotif;
    }
    throw err;
  }
}

export async function getUserNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications.map((n) => ({
      ...n,
      isRead: n.read,
    }));
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      return mockStore.notifications
        .filter((n) => n.userId === userId)
        .map((n) => ({
          ...n,
          isRead: n.read,
        }));
    }
    throw err;
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    return await prisma.notification.count({
      where: { userId, read: false },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      return mockStore.notifications.filter((n) => n.userId === userId && !n.read).length;
    }
    throw err;
  }
}

export async function markNotificationAsRead(id: string, userId: string) {
  try {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Forbidden. You do not own this notification.', 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return {
      ...updated,
      isRead: updated.read,
    };
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      const notif = mockStore.notifications.find((n) => n.id === id);
      if (!notif) throw new AppError('Notification not found', 404);
      if (notif.userId !== userId) throw new AppError('Forbidden. You do not own this notification.', 403);
      notif.read = true;
      return {
        ...notif,
        isRead: true,
      };
    }
    throw err;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  } catch (err: any) {
    if (isDbConnectionError(err)) {
      mockStore.notifications.forEach((n) => {
        if (n.userId === userId) n.read = true;
      });
      return { count: mockStore.notifications.filter((n) => n.userId === userId).length };
    }
    throw err;
  }
}

