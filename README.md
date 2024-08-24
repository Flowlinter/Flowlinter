# FlowLinter SDK

## Installation

    ```bash
    npm install flowlinter
    ```

## Cross-Chain Transfers

    ```
        const { flowlinter } = require('flowlinter');

        const result = await flowlinter.transferFromEthToSolana({
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

## Transaction History

    ```
    const { transactionHistory } = require('flowlinter');

    const ethHistory = await transactionHistory.getEthTransactionHistory('0xYourEthereumAddress');
    const solHistory = await transactionHistory.getSolanaTransactionHistory('YourSolanaAddress');

    console.log('Ethereum Transaction History:', ethHistory);
    console.log('Solana Transaction History:', solHistory);

    ```

## Multi-Chain Support

    ```
    const { multiChainSupport } = require('flowlinter');

    const ethBalance = await multiChainSupport.getBalance('ethereum', '0xYourEthereumAddress');
    const solBalance = await multiChainSupport.getBalance('solana', 'YourSolanaAddress');
    console.log(`Ethereum Balance: ${ethBalance}`);
    console.log(`Solana Balance: ${solBalance}`);

    ```
