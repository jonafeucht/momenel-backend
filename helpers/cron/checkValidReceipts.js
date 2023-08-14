import { Expo } from "expo-server-sdk";
import supabase from "../../supabase/supabase.js";

export async function getReceipt(receiptIds) {
  let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

  let receipt;
  for (const chunk of receiptIdChunks) {
    try {
      receipt = await expo.getPushNotificationReceiptsAsync(chunk);
    } catch (error) {}
  }
  return receipt;
}

export async function fetchUnprocessedReceipts() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const { data, error } = await supabase
    .from("notification_receipts")
    .select("id")
    .lt("created_at", thirtyMinutesAgo.toISOString())
    .eq("processed", "false");

  if (error) {
    return [];
  }
  return data.map((receipt) => receipt.id);
}

export async function markAsProcessed(receiptIds) {
  for (const [receiptId, receiptData] of Object.entries(receiptIds)) {
    if (receiptData.status === "ok") {
      try {
        await supabase
          .from("notification_receipts")
          .update({ processed: true })
          .eq("id", receiptId);
      } catch (error) {}
    } else if (receiptData.status === "error") {
      if (
        receiptData.details &&
        receiptData.details.error === "DeviceNotRegistered"
      ) {
        // get user id from database
        const { data, error } = await supabase
          .from("notification_receipts")
          .select("user_id")
          .eq("id", receiptId);
        if (error) {
        }
        // delete push token from database
        try {
          await supabase
            .from("profiles")
            .update({ notification_token: null })
            .eq("id", data[0].user_id);
        } catch (error) {}
      }
      try {
        await supabase
          .from("notification_receipts")
          .update({ processed: true })
          .eq("id", receiptId);
      } catch (error) {}
    }
  }
}
