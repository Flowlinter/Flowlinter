const { ethers } = require('ethers');
const { Connection, PublicKey } = require('@solana/web3.js');
const TransactionHistory = require('../core/TransactionHistory');

describe('TransactionHistory', () => {
  let transactionHistory;

  beforeEach(() => { 
    const apiKey = 'your-api-key';
    const ethRpcUrl = 'https://eth-rpc-url';
    const solanaRpcUrl = 'https://solana-rpc-url';
    transactionHistory = new TransactionHistory(apiKey, ethRpcUrl, solanaRpcUrl);
  });

  describe('getEthTransactionHistory', () => {
    it('should return transaction history for the given Ethereum address', async () => {
      const address = '0x32Be343B94f860124dC4fEe278FDCBD38C102D88';

      const history = await transactionHistory.getEthTransactionHistory(address);

      // Add your assertions here
    });
  });

  describe('getSolanaTransactionHistory', () => {
    it('should return transaction history for the given Solana address', async () => {
      const address = '3N5zT1w5Q5zT1w5Q5zT1w5Q5zT1w5Q5zT1w5Q5zT1w5Q';

      const history = await transactionHistory.getSolanaTransactionHistory(address);
      
      // Add your assertions here

    });
  });
});