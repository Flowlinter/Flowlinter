# Chain Flow SDK

## Installation

```bash
npm install flowlinter
```

## Cross-Chain Transfers

```
    const { chainFlow } = require('flowlinter');

    const result = await chainFlow.transferFromEthToSolana({
        tokenAddress: '0xYourEthereumTokenAddress',
        amount: '100',
        recipientAddress: 'YourSolanaRecipientAddress',
    });
    console.log(result);

```

## Token Management

```
const { tokenManagement } = require('flowlinter');

const ethBalance = await tokenManagement.getEthTokenBalance('0xYourTokenAddress', '0xYourWalletAddress');
const solBalance = await tokenManagement.getSolanaTokenBalance('YourSolanaTokenMintAddress', 'YourSolanaWalletAddress');
console.log(`ETH Token Balance: ${ethBalance}`);
console.log(`Solana Token Balance: ${solBalance}`);

```
