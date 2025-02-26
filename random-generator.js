const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { AnchorProvider, setProvider } = require("@coral-xyz/anchor");
const { Orao } = require("@orao-network/solana-vrf");
const { Connection, Keypair } = require("@solana/web3.js");

dotenv.config();

function loadWalletKey(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const secretKey = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch (error) {
    console.error("Error loading wallet file:", error.message);
    process.exit(1);
  }
}

async function getRandomNumber(maxValue) {
  const RPC = process.env.RPC_URL;
  const SOLANA_WALLET_PATH = process.env.SOLANA_WALLET_PATH;

  if (!RPC || !SOLANA_WALLET_PATH) {
    console.error("Missing RPC check .env");
    process.exit(1);
  }

  const walletKeypair = loadWalletKey(SOLANA_WALLET_PATH);
  const connection = new Connection(RPC);
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: walletKeypair.publicKey,
      signAllTransactions: async (txs) => {
        txs.forEach((tx) => tx.sign(walletKeypair));
        return txs;
      },
      signTransaction: async (tx) => {
        tx.sign(walletKeypair);
        return tx;
      },
    },
    {}
  );
  setProvider(provider);

  const vrf = new Orao(provider);

  try {
    console.log("Requesting Randomness from VRF...");

    let finalRandom = null;
    const MAX_UINT32 = 2 ** 32;

    while (finalRandom === null) {
      const requestBuilder = await vrf.request();
      const seed = requestBuilder.seed;
      const txSignature = await requestBuilder.rpc();
      console.log("VRF Request Sent Tx:", txSignature);

      const randomness = await vrf.waitFulfilled(seed);
      if (!randomness) {
        console.error("Error: Randomness fulfillment failed. Retrying...");
        continue;
      }

      //console.log("VRF Bytes:", Buffer.from(randomness.randomness).toString("hex"));

      //Re-roll for a number if the randomness is greater than the unbiased max
      const fullRandom = Buffer.from(randomness.randomness).readUInt32LE(0);
      const unbiasedMax = MAX_UINT32 - (MAX_UINT32 % maxValue);

      if (fullRandom < unbiasedMax) {
        finalRandom = (fullRandom % maxValue) + 1;
      } else {
        console.warn("Bias detected. Rerolling...");
      }
    }

    console.log(`Final Fair Random Number (1-${maxValue}):`, finalRandom);
    return finalRandom;
  } catch (err) {
    console.error("Error during VRF request:", err);
    return null;
  }
}

module.exports = { getRandomNumber };
