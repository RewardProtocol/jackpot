# jackpot
Reward Protocol jackpot program

1. Takes a snapshot of token Holders
2. Filters them by token holdings and removes specific given addresses
3. Generates csv with addresses and assigns each address a number/numbers depending on their tickets
4. Uploads csv file to Arweave for verification by anyone
5. Requests random number from VRF
6. Convert random number to sit within max range of total tickets
7. Selects winner
8. Sends all SOL (minus 0.01 for fees etc) to winning wallet address
9. Sends message to Telegram and/or Twitter
