const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const { getRandomNumber } = require("./random-generator");

async function pickWinner(csvFile) {
  try {
    console.log("Reading snapshot file:", csvFile);

    const file = fs.createReadStream(csvFile);
    const results = await new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (parsedData) => resolve(parsedData.data),
        error: reject,
      });
    });

    let totalTickets = 0;
    const ticketMap = new Map();

    results.forEach((row) => {
      const wallet = row.walletAddress;
      const tickets = row.tickets.split(",").map(Number);
      tickets.forEach((ticket) => ticketMap.set(ticket, wallet));
      totalTickets += tickets.length;
    });

    console.log(`Total Tickets: ${totalTickets}`);

    console.log("Requesting a random winner...");
    const randomTicket = await getRandomNumber(totalTickets);

    if (randomTicket === null) {
      console.error("Failed to get a valid random number.");
      return;
    }

    const winner = ticketMap.get(randomTicket);
    console.log(`Winner Selected: ${winner}`);

    return winner;
  } catch (error) {
    console.error("Error picking winner:", error);
  }
}

const snapshotFile = "./droplist.csv";
pickWinner(snapshotFile);
