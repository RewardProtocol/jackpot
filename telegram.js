const fetch = require("node-fetch");
require("dotenv").config();

async function sendMessageToTelegram(message) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    const data = await response.json();
    console.log("Telegram message sent.");
    return data.result?.message_id;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    throw error;
  }
}

async function pinMessageInTelegram(messageId) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${botToken}/pinChatMessage`;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
    console.log("Telegram message pinned.");
  } catch (error) {
    console.error("Error pinning Telegram message:", error);
  }
}

module.exports = {
  sendMessageToTelegram,
  pinMessageInTelegram,
};
