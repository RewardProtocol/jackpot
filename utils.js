const dotenv = require("dotenv");
const fs = require("fs");
const { Keypair, Connection, PublicKey } = require("@solana/web3.js");

dotenv.config();

const connection = new Connection(process.env.RPC_URL);

function loadWalletKey() {
  return Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(process.env.SOLANA_KEYPAIR_PATH).toString()))
  );
}

module.exports = { connection, loadWalletKey };
