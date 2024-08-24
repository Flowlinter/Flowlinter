import CrossChainTransfer from '../core/CrossChainTransfer';

describe('CrossChainTransfer', () => {
  let crossChainTransfer;

  beforeEach(() => {
    require('dotenv').config();

    crossChainTransfer = new CrossChainTransfer(process.env.API_KEY, process.env.ETH_RPC_URL, process.env.SOLANA_RPC_URL);
  });

  describe('transferFromEthToSolana', () => {
    it('should transfer tokens from Ethereum to Solana', async () => {
      const tokenAddress = '0x1234567890abcdef';
      const amount = 100;
      const recipientAddress = '0xabcdef1234567890';

      const result = await crossChainTransfer.transferFromEthToSolana({ tokenAddress, amount, recipientAddress });

      expect(result.ethTxHash).toBeDefined();
      expect(result.solanaTxId).toBeDefined();
    });

    it('should throw an error for invalid addresses', async () => {
      const tokenAddress = 'invalid-address';
      const amount = 100;
      const recipientAddress = 'invalid-address';

      await expect(crossChainTransfer.transferFromEthToSolana({ tokenAddress, amount, recipientAddress })).rejects.toThrow('Transfer failed: Invalid address');
    });
  });

  describe('transferFromSolanaToEth', () => {
    it('should transfer tokens from Solana to Ethereum', async () => {
      const tokenAddress = '0x1234567890abcdef';
      const recipientAddress = '0xabcdef1234567890';
      const amount = 100;

      const result = await crossChainTransfer.transferFromSolanaToEth({ tokenAddress, recipientAddress, amount });

      expect(result).toBeDefined();
    });

    it('should throw an error for invalid addresses', async () => {
      const tokenAddress = 'invalid-address';
      const recipientAddress = 'invalid-address';
      const amount = 100;

      await expect(crossChainTransfer.transferFromSolanaToEth({ tokenAddress, recipientAddress, amount })).rejects.toThrow('Invalid address');
    });
  });
});