# Flowlinter SDK Documentation

# Overview

The `flowlinter-sdk` is a powerful tool designed to facilitate cross-chain transfers between different blockchains using the Wormhole protocol. This SDK abstracts the complexities involved in transferring tokens and other digital assets across different distinct blockchain ecosystems, providing a simplified and unified interface for developers.

With the help of this SDK, moving tokens and other assets between blockchains is made easier, and all of this asset management is done in one location.

<!-- # Usage -->

### Key Features:

- **Cross-Chain Transfers**: Seamlessly transfer tokens and assets any supported chain.
- **Token Management**: Easily manage and query token balances on any supported chain.
- **Transaction History**: Retrieve transaction histories on any supported chain.
- **Multi-Chain Support**: Access and manage balances across multiple blockchains through a single interface.

### Use Cases:

- **Decentralized Finance (DeFi)**: Enable cross-chain liquidity and asset transfers in DeFi applications.
- **Gaming**: Transfer in-game assets and tokens between Ethereum and Solana-based games.
- **NFT Marketplaces**: Facilitate the transfer of NFTs across different blockchain networks.
- **Cross-Chain Arbitrage**: Take advantage of price differences for tokens across Ethereum and Solana.

By leveraging the `flowlinter-sdk`, developers can build robust applications that interact with in diffrent blockchains, enhancing the interoperability and functionality of their decentralized applications (dApps).

## Installation

To use the flowlinter-sdk in your project, install it via npm:

```bash
npm install flowlinter-sdk
```

## Importing the SDK

To use the flowlinter-sdk, import the CrossChainTransfer class:

```javascript
const { CrossChainTransfer } = require("flowlinter-sdk");
require("dotenv").config(); // Load environment variables
```

## Initializing the SDK

Create an instance of CrossChainTransfer with your private key:

```javascript
const privateKey = process.env.PRIVATE_KEY;
const transfer = new CrossChainTransfer(privateKey);
```

## Cross-Chain Transfers

The `flowlinter-sdk` simplifies the process of transferring tokens and other assets between the between different blockchains. This is achieved through the Wormhole protocol, which acts as a bridge between the two networks.

The SDK provides a straightforward method to initiate and manage these cross-chain transfers.

### Example Usage

To perform a cross-chain transfer from Ethereum to Solana, you can use the `transferFromEthToSolana` method provided by the SDK. Here’s a step-by-step example:

```javascript
const { Crosschaintransfer } = require("flowlinter-sdk");

const result = await flowlinter;

transferFromEthToSolana({
  tokenAddress: "0xYourEthereumTokenAddress",
  amount: "100",
  recipientAddress: "YourSolanaRecipientAddress",
});

console.log(result);
```

### Parameters

- **tokenAddress**: The address of the token on the Ethereum blockchain that you wish to transfer.

- **amount**: The amount of tokens to transfer.

- **recipientAddress**: The recipient's address on the Solana blockchain.

### Return Value

The **transferFromEthToSolana** method returns a promise that resolves to the result of the transfer operation. This result typically includes transaction details such as transaction IDs, status, and any relevant messages.

## Token Management

The **_flowlinter-sdk_** provides robust tools for managing and querying token balances on both the Ethereum and Solana blockchains. This functionality is essential for applications that need to display token balances, perform balance checks before transactions, or manage assets across multiple blockchains.

### Example Usage

To manage and query token balances, you can use the **_tokenManagement_** module provided by the SDK.

Here’s a step-by-step example:

```javascript
const { tokenManagement } = require("flowlinter-sdk");

// Get Ethereum token balance

const ethBalance = await tokenManagement.getEthTokenBalance(
  "0xYourTokenAddress", // The Ethereum token address
  "0xYourWalletAddress" // The wallet address to check the balance for
);

// Get Solana token balance

const solBalance = await tokenManagement.getSolanaTokenBalance(
  "YourSolanaTokenMintAddress", // // The Solana token mint address
  "YourSolanaWalletAddress" // The wallet address to check the balance for
);

console.log(`ETH Token Balance: ${ethBalance}`);
console.log(`Solana Token Balance: ${solBalance}`);
```

### Methods

#### getEthTokenBalance (tokenAddress, walletAddress)

#### getSolanaTokenBalance(tokenMintAddress, walletAddress)

**tokenAddress:** The address of the token on the Ethereum blockchain.

**walletAddress:** The wallet address for which the balance is being queried.

**Returns:** A promise that resolves to the balance of the specified token for the given wallet address.

By leveraging the tokenManagement module of the flowlinter-sdk, developers can efficiently manage and display token balances within their applications, enhancing the user experience and ensuring accurate asset management.

## Transaction History

The `flowlinter-sdk` provides tools to retrieve transaction histories for addresses on both the Ethereum and Solana blockchains. This functionality is crucial for applications that need to display past transactions, track asset movements, or provide users with a detailed transaction log.

### Example Usage

To retrieve transaction histories, you can use the `transactionHistory` module provided by the SDK. Here’s a step-by-step example:

```javascript
const { transactionHistory } = require("flowlinter-sdk");

const ethHistory = await transactionHistory.getEthTransactionHistory(
  "0xYourEthereumAddress"
);

const solHistory = await transactionHistory.getSolanaTransactionHistory(
  "YourSolanaAddress"
);

console.log("Ethereum Transaction History:", ethHistory);
console.log("Solana Transaction History:", solHistory);
```

### Methods

#### getEthTransactionHistory(ethereumAddress)

**_ethereumAddress:_** The Ethereum address for which the transaction history is being queried.

**_Returns:_** A promise that resolves to an array of transaction objects for the specified Ethereum address.

#### getSolanaTransactionHistory(solanaAddress)

**_solanaAddress:_** The Solana address for which the transaction history is being queried.

**_Returns:_** A promise that resolves to an array of transaction objects for the specified Solana address.

## Multi-Chain Support

The `flowlinter-sdk` provides comprehensive support for managing assets across multiple blockchains. This functionality allows developers to interact with various blockchain networks through a unified interface, simplifying the process of querying balances and managing assets on different chains.

### Example Usage

To access and manage balances across multiple blockchains, you can use the `multiChainSupport` module provided by the SDK. Here’s a step-by-step example:

```javascript
const { multiChainSupport } = require("flowlinter-sdk");

const ethBalance = await multiChainSupport.getBalance(
  "ethereum",
  "0xYourEthereumAddress"
);
const solBalance = await multiChainSupport.getBalance(
  "solana",
  "YourSolanaAddress"
);

console.log(`Ethereum Balance: ${ethBalance}`);
console.log(`Solana Balance: ${solBalance}`);
```

## Methods

### getBalance(network, address)

- Network : The blockchain network to query (e.g., "ethereum", "solana").

- Address : The address for which the balance is being queried.

- Returns: A promise that resolves to the balance of the specified address on the given network.
