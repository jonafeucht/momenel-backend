import { Expo } from "expo-server-sdk";
import supabase from "../supabase/supabase.js";

let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

async function SendNotification({ type, senderId, receiverId, comment }) {
  try {
    let pushToken = "";
    let message = {};
    const { data: receiver } = await supabase
      .from("profiles")
      .select("notification_token,username")
      .eq("id", receiverId)
      .single();
    pushToken = receiver.notification_token;
    // get push token of receiver and sender
    const { data: sender } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", senderId)
      .single();
    // get count of unread notifications
    let badgeCount = 0;
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", receiverId)
        .eq("isRead", false);
      badgeCount = count;
    } catch (error) {}
    if (!pushToken) return;

    if (type === "post_like") {
      message = {
        to: pushToken,
        title: "New Like on Your Post! ❤️",
        body: `@${sender.username} liked your post`,
        sound: "default",
        badge: badgeCount,
      };
    } else if (type === "post_repost") {
      message = {
        to: pushToken,
        title: "New Repost on Your Post! 🎉",
        body: `@${sender.username} reposted your post`,
        sound: "default",
        badge: badgeCount,
      };
    } else if (type === "post_comment") {
      message = {
        to: pushToken,
        title: "New Comment on Your Post! 💬",
        subtitle: `@${sender.username} commented on your post`,
        body: comment.length > 35 ? comment.substring(0, 35) + "..." : comment,
        sound: "default",
        badge: badgeCount,
      };
    } else if (type === "comment_mention") {
      message = {
        to: pushToken,
        title: "You were mentioned in a comment! 💬",
        subtitle: `@${sender.username} mentioned you in a comment`,
        body: comment.length > 35 ? comment.substring(0, 35) + "..." : comment,
        sound: "default",
        badge: badgeCount,
      };
    } else if (type === "post_mention") {
      message = {
        to: pushToken,
        title: "You were mentioned in a post! 💬",
        subtitle: `@${sender.username} mentioned you in a post`,
        sound: "default",
        badge: badgeCount,
      };
    } else if (type === "comment_like") {
      message = {
        to: pushToken,
        title: "New Like on Your Comment! ❤️",
        body: `@${sender.username} liked your comment`,
        sound: "default",
        badge: badgeCount,
      };
    } else if (type === "follow") {
      message = {
        to: pushToken,
        title: "New Follower! 🎉",
        body: `@${sender.username} followed you`,
        sound: "default",
        badge: badgeCount,
      };
    } else if (type === "post_published") {
      message = {
        to: pushToken,
        title: "Success! Your post is now live! 🚀",
        sound: "default",
        badge: badgeCount,
        priority: "high",
      };
    }

    const chunks = expo.chunkPushNotifications([{ to: pushToken, ...message }]);
    const tickets = [];
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {}
    }
    let response = "";

    for (const ticket of tickets) {
      if (ticket.status === "error") {
        if (ticket.details && ticket.details.error === "DeviceNotRegistered") {
          response = "DeviceNotRegistered";

          // delete push token from database
          try {
            await supabase
              .from("profiles")
              .update({ notification_token: null })
              .eq("id", receiverId);
          } catch (error) {}
        }
      }

      if (ticket.status === "ok") {
        response = ticket.id;
      }
    }

    // add receipt to database
    try {
      await supabase.from("notification_receipts").insert([
        {
          id: response,
          user_id: receiverId,
        },
      ]);
    } catch (error) {}

    return response;
  } catch (error) {}
}

export default SendNotification;
