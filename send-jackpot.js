import {
  SystemProgram,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { connection, loadWalletKey } from "./utils.js";
//import { fetchSolPrice } from "./price.js";

const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
  units: 1050,
});
const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: 1_000_000,
});

export async function sendJackpot(recipient) {
  const senderKeypair = loadWalletKey();
  const senderBalance = await connection.getBalance(senderKeypair.publicKey);
  const feeBuffer = 0.01 * 1e9;
  let amountToSend = senderBalance - feeBuffer;

  if (amountToSend < 0) {
    console.error("Insufficient balance.");
    return;
  }

  const transaction = new solanaWeb3.Transaction()
    .add(modifyComputeUnits, addPriorityFee)
    .add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: new solanaWeb3.PublicKey(recipient),
        lamports: amountToSend,
      })
    );

  const signature = await sendAndConfirmTransaction(connection, transaction, [
    senderKeypair,
  ]);
  console.log("Transaction successful:", signature);
  return signature;
}
