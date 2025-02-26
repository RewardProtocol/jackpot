const fs = require("fs");
const path = require("path");
const { NodeBundlr } = require("@bundlr-network/client");
const { Connection, Keypair } = require("@solana/web3.js");
const dotenv = require("dotenv");
const bs58 = require("bs58");

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

async function uploadCSVToArweave(filePath) {
  try {
    console.log("Uploading snapshot to Arweave...");

    const RPC = process.env.RPC_URL;
    const SOLANA_WALLET_PATH = process.env.SOLANA_WALLET_PATH;

    if (!RPC || !SOLANA_WALLET_PATH) {
      console.error("Missing RPC's in .env");
      return null;
    }

    const keypair = loadWalletKey(SOLANA_WALLET_PATH);
    console.log("Wallet loaded successfully:", keypair.publicKey.toBase58());

    const privateKeyBase58 = bs58.default.encode(keypair.secretKey);

    const bundlr = new NodeBundlr(
      "https://node1.bundlr.network",
      "solana",
      privateKeyBase58,
      { providerUrl: RPC }
    );

    const data = fs.readFileSync(filePath);
    console.log("CSV file loaded, size:", data.length, "bytes");

    const tx = await bundlr.upload(data, {
      tags: [{ name: "Content-Type", value: "text/csv" }],
    });

    const url = `https://arweave.net/${tx.id}`;
    console.log("CSV uploaded to Arweave:", url);
    return url;
  } catch (error) {
    console.error("Error uploading to Arweave:", error);
    return null;
  }
}

module.exports = { uploadCSVToArweave };

if (require.main === module) {
  (async () => {
    await uploadCSVToArweave("./droplist.csv");
  })();
}
