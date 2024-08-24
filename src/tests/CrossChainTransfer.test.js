import CrossChainTransfer from '../core/CrossChainTransfer';

describe('CrossChainTransfer', () => {
  let crossChainTransfer;

  beforeEach(() => {
    require('dotenv').config();

    crossChainTransfer = new CrossChainTransfer(process.env.API_KEY, process.env.ETH_RPC_URL, process.env.SOLANA_RPC_URL);
  });

  // Test cases for the transferFromEthToSolana method

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

  // Test cases for the transferFromSolanaToEth method

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
});describe('CrossChainTransfer', () => {
  let crossChainTransfer;

  beforeEach(() => {
    require('dotenv').config();

    crossChainTransfer = new CrossChainTransfer(process.env.API_KEY, process.env.ETH_RPC_URL, process.env.SOLANA_RPC_URL);
  });

  // Test cases for the transferFromEthToSolana method

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
  
  // Test cases for the transferFromSolanaToEth method

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

  // Additional test cases

  describe('redeemOnSolana', () => {
    it('should redeem tokens on Solana using the signed VAA', async () => {
      const signedVAA = '0x1234567890abcdef';
      const recipientAddress = '0xabcdef1234567890';

      const result = await crossChainTransfer.redeemOnSolana(signedVAA, recipientAddress);

      expect(result).toBeDefined();
    });
  });

  describe('createRedemptionInstruction', () => {
    it('should create a redemption instruction', () => {
      const signedVAA = '0x1234567890abcdef';
      const recipientAddress = '0xabcdef1234567890';

      const result = crossChainTransfer.createRedemptionInstruction(signedVAA, recipientAddress);

      expect(result).toBeDefined();
    });
  });

  describe('isValidBase58', () => {
    it('should return true for a valid base58 string', () => {
      const str = '5QCs8X';

      const result = crossChainTransfer.isValidBase58(str);

      expect(result).toBe(true);
    });

    it('should return false for an invalid base58 string', () => {
      const str = 'invalid-string';

      const result = crossChainTransfer.isValidBase58(str);

      expect(result).toBe(false);
    });
  });

  describe('isValidSolanaAddress', () => {
    it('should return true for a valid Solana address', () => {
      const address = '5QCs8X';

      const result = crossChainTransfer.isValidSolanaAddress(address);

      expect(result).toBe(true);
    });

    it('should return false for an invalid Solana address', () => {
      const address = 'invalid-address';

      const result = crossChainTransfer.isValidSolanaAddress(address);

      expect(result).toBe(false);
    });
  });
});