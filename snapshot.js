require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { PublicKey, Connection } = require("@solana/web3.js");
const { get } = require("lodash");
const { TOKEN_2022_PROGRAM_ID } = require("@solana/spl-token");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const connection = new Connection(process.env.RPC_URL, "confirmed");

const filterAddresses = (process.env.FILTER_ADDRESSES || "")
  .split(",")
  .map((addr) => addr.trim());

async function getTokenOwners(address, tokenDecimals, filterAddresses) {
  const filters = [
    { memcmp: { offset: 0, bytes: address } },
    { memcmp: { offset: 165, bytes: "3" } },
  ];

  const listOfTokens = await connection.getParsedProgramAccounts(
    TOKEN_2022_PROGRAM_ID,
    {
      filters,
      encoding: "jsonParsed",
    }
  );

  return listOfTokens
    .map((token) => {
      const walletAddress = get(token, "account.data.parsed.info.owner");
      const amountString = get(
        token,
        "account.data.parsed.info.tokenAmount.amount"
      );
      const amount = parseInt(amountString, 10) / 10 ** tokenDecimals;

      if (filterAddresses.includes(walletAddress)) return null;

      // 1 ticket = 1 million tokens
      const numTickets = Math.floor(amount / 1_000_000);
      if (numTickets < 1) return null;

      return { walletAddress, numTickets };
    })
    .filter((owner) => owner !== null);
}

async function assignTickets(owners) {
  let totalTickets = 0;
  let ticketCounter = 1;

  owners.forEach((holder) => {
    holder.tickets = [];
    for (let i = 0; i < holder.numTickets; i++) {
      holder.tickets.push(ticketCounter);
      ticketCounter++;
    }
    totalTickets += holder.numTickets;
  });

  console.log(`Total Tickets: ${totalTickets}`);
  return { owners, totalTickets };
}

async function mainSnapshot() {
  try {
    console.log("Fetching token holders...");

    // Pull data from .env
    const tokenAddress = process.env.TOKEN_ADDRESS;
    const tokenDecimals = parseInt(process.env.TOKEN_DECIMALS, 10);

    const owners = await getTokenOwners(tokenAddress, tokenDecimals, filterAddresses);
    owners.sort((a, b) => b.numTickets - a.numTickets);

    const { owners: ticketHolders, totalTickets } = await assignTickets(owners);

    const outputFile = "./droplist.csv";
    const csvWriter = createCsvWriter({
      path: path.resolve(outputFile),
      header: [
        { id: "walletAddress", title: "walletAddress" },
        { id: "numTickets", title: "numTickets" },
        { id: "tickets", title: "tickets" },
      ],
    });

    await csvWriter.writeRecords(
      ticketHolders.map((holder) => ({
        walletAddress: holder.walletAddress,
        numTickets: holder.numTickets,
        tickets: holder.tickets.join(","),
      }))
    );

    console.log(`Data exported to ${outputFile}`);

    return { totalTickets, outputFile, holders: ticketHolders };
  } catch (error) {
    console.error("Error in snapshot process:", error);
  }
}

if (require.main === module) {
  (async () => {
    await mainSnapshot();
  })();
}

module.exports = { mainSnapshot };
