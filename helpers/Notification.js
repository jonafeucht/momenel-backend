import { Expo } from "expo-server-sdk";
import supabase from "../supabase/supabase.js";

let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

async function SendNotification({ type, senderId, receiverId }) {
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
  }

  const chunks = expo.chunkPushNotifications([{ to: pushToken, ...message }]);
  const tickets = [];
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }
  let response = "";

  for (const ticket of tickets) {
    if (ticket.status === "error") {
      if (ticket.details && ticket.details.error === "DeviceNotRegistered") {
        response = "DeviceNotRegistered";
        console.log("DeviceNotRegistered");
        // delete push token from database
        try {
          await supabase
            .from("profiles")
            .update({ notification_token: null })
            .eq("id", receiverId);
        } catch (error) {}
      }
    }
    console.log("ticket: ", ticket);
    if (ticket.status === "ok") {
      response = ticket.id;
    }
  }
  console.log("reciept: ", response);
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
}

// const getReceipt = async (receiptId) => {
//   let receiptIdChunks = expo.chunkPushNotificationReceiptIds([receiptId]);

//   let receipt;

//   for (const chunk of receiptIdChunks) {
//     try {
//       receipt = await expo.getPushNotificationReceiptsAsync(chunk);
//       console.log("push: ", receipt);
//     } catch (error) {
//       console.error(error);
//     }
//   }

//   return receipt ? receipt[receiptId] : null;
// };

export default SendNotification;
