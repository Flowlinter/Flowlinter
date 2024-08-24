import CrossChainTransfer from '../core/CrossChainTransfer';

describe('CrossChainTransfer', () => {
  let crossChainTransfer;

  beforeEach(() => {
    crossChainTransfer = new CrossChainTransfer();
  });

  describe('transferFromSolanaToEth', () => {
    it('should transfer tokens from Solana to Ethereum', async () => {
      const tokenAddress = 'solana-token-address';
      const amount = 100;
      const recipientAddress = 'ethereum-recipient-address';

      await expect(crossChainTransfer.transferFromSolanaToEth({ tokenAddress, amount, recipientAddress })).resolves.not.toThrow();
    });

    it('should throw an error if transfer tokens from Solana to Ethereum fails', async () => {
      const tokenAddress = 'solana-token-address';
      const amount = 100;
      const recipientAddress = 'ethereum-recipient-address';

      await expect(crossChainTransfer.transferFromSolanaToEth({ tokenAddress, amount, recipientAddress })).rejects.toThrow();
    });
  });

  describe('transferFromEthToSolana', () => {
    it('should transfer tokens from Ethereum to Solana', async () => {
      const tokenAddress = 'ethereum-token-address';
      const amount = 100;
      const recipientAddress = 'solana-recipient-address';

      await expect(crossChainTransfer.transferFromEthToSolana({ tokenAddress, amount, recipientAddress })).resolves.not.toThrow();
    });

    it('should throw an error if transfer tokens from Ethereum to Solana fails', async () => {
      const tokenAddress = 'ethereum-token-address';
      const amount = 100;
      const recipientAddress = 'solana-recipient-address';

      await expect(crossChainTransfer.transferFromEthToSolana({ tokenAddress, amount, recipientAddress })).rejects.toThrow();
    });
  });

  describe('isValidEthereumAddress', () => {
    it('should return true for a valid Ethereum address', () => {
      const address = 'ethereum-address';

      const result = crossChainTransfer.isValidEthereumAddress(address);

      expect(result).toBe(true);
    });

    it('should return false for an invalid Ethereum address', () => {
      const address = 'invalid-address';

      const result = crossChainTransfer.isValidEthereumAddress(address);

      expect(result).toBe(false);
    });
  });

  describe('isValidSolanaAddress', () => {
    it('should return true for a valid Solana address', () => {
      const address = 'solana-address';

      const result = crossChainTransfer.isValidSolanaAddress(address);

      expect(result).toBe(true);
    });

    it('should return false for an invalid Solana address', () => {
      const address = 'invalid-address';

      const result = crossChainTransfer.isValidSolanaAddress(address);

      expect(result).toBe(false);
    });
  });

  describe('isValidBase58', () => {
    it('should return true for a valid base58 string', () => {
      const str = 'base58-string';

      const result = crossChainTransfer.isValidBase58(str);

      expect(result).toBe(true);
    });

    it('should return false for an invalid base58 string', () => {
      const str = 'invalid-string';

      const result = crossChainTransfer.isValidBase58(str);

      expect(result).toBe(false);
    });
  });
});