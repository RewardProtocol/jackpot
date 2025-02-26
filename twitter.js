const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

async function sendTweet(message) {
  try {
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY,
      appSecret: process.env.TWITTER_APP_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    await twitterClient.v2.tweet(message);
    console.log("Tweet posted successfully.");
  } catch (error) {
    console.error("Failed to send tweet:", error);
    throw error;
  }
}

module.exports = { sendTweet };
