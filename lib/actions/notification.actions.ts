"use server";

import { connectToDatabase } from "@/lib/database";
import Notification from "@/lib/database/models/notification.model";
import { getCurrentAdminProfile } from "@/lib/auth-guard";
import { INotification } from "@/types";

function getNotificationAudience(profile: NonNullable<Awaited<ReturnType<typeof getCurrentAdminProfile>>>) {
  const email = profile.email.toLowerCase();
  if (profile.role === "super_admin" || profile.role === "engineer") {
    return {
      $or: [
        { recipientEmails: { $in: [email] } },
        { recipientEmails: { $exists: false } },
        { recipientEmails: { $size: 0 } },
      ],
    };
  }
  if (profile.role === "admin") return { recipientEmails: { $in: [email] } };
  return { _id: { $exists: false } };
}

function canAccessNotificationCenter(role: string) {
  return role === "super_admin" || role === "admin" || role === "engineer";
}

/**
 * Fetches notifications for super admins and admins along with the unread count.
 */
export async function getSuperAdminNotifications() {
  await connectToDatabase();
  const profile = await getCurrentAdminProfile();

  if (!profile || !canAccessNotificationCenter(profile.role)) {
    return { notifications: [], unreadCount: 0 };
  }

  const audience = getNotificationAudience(profile);
  const notifications = (await Notification.find(audience)
    .sort({ createdAt: -1 })
    .limit(30)
    .lean()) as unknown as INotification[];

  const unreadCount = await Notification.countDocuments({
    $and: [audience, { readBy: { $ne: profile.email.toLowerCase() } }],
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

  if (!profile || !canAccessNotificationCenter(profile.role)) {
    return 0;
  }

  return Notification.countDocuments({
    $and: [getNotificationAudience(profile), { readBy: { $ne: profile.email.toLowerCase() } }],
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

  if (!profile || !canAccessNotificationCenter(profile.role)) {
    throw new Error("Unauthorized.");
  }

  const notification = await Notification.findOne({
    $and: [{ _id: notificationId }, getNotificationAudience(profile)],
  }).select("_id");
  if (!notification) {
    throw new Error("Notification not found.");
  }

  await Notification.updateOne({ _id: notificationId }, {
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

  if (!profile || !canAccessNotificationCenter(profile.role)) {
    throw new Error("Unauthorized.");
  }

  await Notification.updateMany(
    { $and: [getNotificationAudience(profile), { readBy: { $ne: profile.email.toLowerCase() } }] },
    { $addToSet: { readBy: profile.email.toLowerCase() } },
  );

  return { success: true };
}
