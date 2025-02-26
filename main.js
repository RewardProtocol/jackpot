require("dotenv").config();
const fs = require("fs");
const Papa = require("papaparse");
const path = require("path");
const { Keypair, Connection, PublicKey, SystemProgram, sendAndConfirmTransaction } = require("@solana/web3.js");
const { mainSnapshot } = require("./snapshot");
const { uploadCSVToArweave } = require("./upload-arweave");
const { getRandomNumber } = require("./random-generator");
const { sendTweet } = require("./twitter");
const { sendMessageToTelegram, pinMessageInTelegram } = require("./telegram");

function loadWalletKey(filePath) {
  const secretKey = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function sendAllSolMinusFees(senderKeypair, recipientAddress, minusSol = 0.01) {
  try {
    const connection = new Connection(process.env.RPC_URL);
    const senderBalanceLamports = await connection.getBalance(senderKeypair.publicKey);
    const minusLamports = minusSol * 1e9;
    const amountToSend = senderBalanceLamports - minusLamports;

    if (amountToSend <= 0) {
      throw new Error("Insufficient balance 0.01 minimum.");
    }

    const transaction = new (require("@solana/web3.js").Transaction)().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: amountToSend,
      })
    );

    const txSignature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);
    return `https://solscan.io/tx/${txSignature}`;
  } catch (error) {
    console.error("Error sending SOL minus fees:", error);
    return null;
  }
}

async function main() {
  try {
    console.log("Starting Jackpot Draw...");

    const { totalTickets, outputFile, holders } = await mainSnapshot();
    if (!totalTickets || !outputFile || !holders) {
      console.error("Snapshot generation failed or found 0 tickets");
      return;
    }
    console.log(`Total Tickets: ${totalTickets}`);

    console.log("Uploading csv to Arweave...");
    const arweaveURL = await uploadCSVToArweave(outputFile);
    if (!arweaveURL) {
      console.error("Failed to upload csv to Arweave");
      return;
    }
    console.log(`Snapshot uploaded: ${arweaveURL}`);

    console.log("Requesting VRF random number...");
    const winningTicket = await getRandomNumber(totalTickets);
    if (!winningTicket) {
      console.error("VRF generation failed");
      return;
    }
    console.log(`Winning Ticket Number: ${winningTicket}`);

    const winnerHolder = holders.find(h => h.tickets.includes(winningTicket));
    if (!winnerHolder) {
      console.error(" Could not find a holder for that winning ticket");
      return;
    }
    const winnerAddress = winnerHolder.walletAddress;
    console.log(`Winner chosen: ${winnerAddress}`);

    //console.log("Loading jackpot wallet keypair...");
    const senderKeypair = loadWalletKey(process.env.SOLANA_WALLET_PATH);

    console.log(`Sending jackpot to ${winnerAddress}...`);
    const txUrl = await sendAllSolMinusFees(senderKeypair, winnerAddress, 0.01);
    if (!txUrl) {
      console.error("Failed to send jackpot SOL");
      return;
    }
    console.log(`✅ Jackpot Sent Tx: ${txUrl}`);

    //TODO:
    // Add price script to get the amount in USD

    const message = `
    🥳 Congratulations to: ${winnerAddress} 🛡️🔐
    
    🎉 You have Won The Daily Jackpot! 🍀 
      
    💵 Total amount ${amountToSend.toFixed(2)} SOL 💰   
    
    ℹ️ Transaction Details on Solscan:  
    https://solscan.io/tx/${signature}

    Winning Ticket: ${winningTicket}
🔗 Snapshot: ${arweaveURL}
    
    `.trim();

   
    console.log("Posting announcements...");
    try {
      await sendTweet(message);
      console.log("Tweet posted");
    } catch (e) {
      console.warn("Tweet failed:", e.message);
    }

    try {
      const msgId = await sendMessageToTelegram(message);
      if (msgId) {
        await pinMessageInTelegram(msgId);
        console.log("Telegram message pinned");
      }
    } catch (e) {
      console.warn("Telegram message failed:", e.message);
    }

    console.log("Jackpot Draw Process Completed");
  } catch (err) {
    console.error("Error in main jackpot process:", err);
  }
}

main();
