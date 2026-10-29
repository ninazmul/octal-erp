"use server";

import { connectToDatabase } from "@/lib/database";
import Notification from "@/lib/database/models/notification.model";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import { INotification } from "@/types";

/**
 * Fetches notifications for super admins and admins along with the unread count.
 */
export async function getSuperAdminNotifications() {
  await connectToDatabase();
  const profile = await getCurrentAdminProfile();

  if (!profile) {
    return { notifications: [], unreadCount: 0 };
  }

  const notifications = (await Notification.find({})
    .sort({ createdAt: -1 })
    .limit(30)
    .lean()) as unknown as INotification[];

  const unreadCount = await Notification.countDocuments({
    readBy: { $ne: profile.email.toLowerCase() },
  });

  return {
    notifications: JSON.parse(JSON.stringify(notifications)) as INotification[],
    unreadCount,
  };
}

/** Fetches only the bell-badge count; notification rows load when the menu opens. */
export async function getSuperAdminUnreadCount() {
  await connectToDatabase();
  const profile = await getCurrentAdminProfile();

  if (!profile) {
    return 0;
  }

  return Notification.countDocuments({
    readBy: { $ne: profile.email.toLowerCase() },
  });
}

// Export alias for clarity
export const getAdminNotifications = getSuperAdminNotifications;

/**
 * Marks a notification as read by an authorized admin.
 */
export async function markNotificationAsRead(notificationId: string) {
  await connectToDatabase();
  const profile = await getCurrentAdminProfile();

  if (!profile) {
    throw new Error("Unauthorized.");
  }

  const notification = await Notification.findById(notificationId).select("_id");
  if (!notification) {
    throw new Error("Notification not found.");
  }

  await Notification.findByIdAndUpdate(notificationId, {
    $addToSet: { readBy: profile.email.toLowerCase() },
  });

  return { success: true };
}

/**
 * Marks all notifications visible to the current admin as read.
 */
export async function markAllNotificationsAsRead() {
  await connectToDatabase();
  const profile = await getCurrentAdminProfile();

  if (!profile) {
    throw new Error("Unauthorized.");
  }

  await Notification.updateMany(
    {
      readBy: { $ne: profile.email.toLowerCase() },
    },
    { $addToSet: { readBy: profile.email.toLowerCase() } },
  );

  return { success: true };
}
