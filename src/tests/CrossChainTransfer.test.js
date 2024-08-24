import CrossChainTransfer from '../core/CrossChainTransfer';

describe('CrossChainTransfer', () => {
  let crossChainTransfer;

  beforeEach(() => {
    crossChainTransfer = new CrossChainTransfer();
  });

  describe('attestSolanaToEthereum', () => {
    it('should attest and create wrapped tokens from Solana to Ethereum', async () => {
      const payerAddress = 'solana-payer-address';
      const mintAddress = 'solana-mint-address';

      await expect(crossChainTransfer.attestSolanaToEthereum({ payerAddress, mintAddress })).resolves.not.toThrow();
    });

    it('should throw an error if attest and create wrapped tokens from Solana to Ethereum fails', async () => {
      const payerAddress = 'solana-payer-address';
      const mintAddress = 'solana-mint-address';

      await expect(crossChainTransfer.attestSolanaToEthereum({ payerAddress, mintAddress })).rejects.toThrow();
    });
  });

  describe('attestEthereumToSolana', () => {
    it('should attest and create wrapped tokens from Ethereum to Solana', async () => {
      const tokenAddress = 'ethereum-token-address';
      const signer = 'ethereum-signer';

      await expect(crossChainTransfer.attestEthereumToSolana({ tokenAddress, signer })).resolves.not.toThrow();
    });

    it('should throw an error if attest and create wrapped tokens from Ethereum to Solana fails', async () => {
      const tokenAddress = 'ethereum-token-address';
      const signer = 'ethereum-signer';

      await expect(crossChainTransfer.attestEthereumToSolana({ tokenAddress, signer })).rejects.toThrow();
    });
  });

  describe('transferFromSolanaToEth', () => {
    it('should transfer tokens from Solana to Ethereum', async () => {
      const payerAddress = 'solana-payer-address';
      const fromAddress = 'solana-from-address';
      const mintAddress = 'solana-mint-address';
      const amount = 100;
      const targetAddress = 'ethereum-target-address';

      await expect(crossChainTransfer.transferFromSolanaToEth({ payerAddress, fromAddress, mintAddress, amount, targetAddress })).resolves.not.toThrow();
    });

    it('should throw an error if transfer tokens from Solana to Ethereum fails', async () => {
      const payerAddress = 'solana-payer-address';
      const fromAddress = 'solana-from-address';
      const mintAddress = 'solana-mint-address';
      const amount = 100;
      const targetAddress = 'ethereum-target-address';

      await expect(crossChainTransfer.transferFromSolanaToEth({ payerAddress, fromAddress, mintAddress, amount, targetAddress })).rejects.toThrow();
    });
  });

  describe('transferFromEthToSolana', () => {
    it('should transfer tokens from Ethereum to Solana', async () => {
      const tokenAddress = 'ethereum-token-address';
      const amount = 100;
      const recipientAddress = 'solana-recipient-address';
      const signer = 'ethereum-signer';

      await expect(crossChainTransfer.transferFromEthToSolana({ tokenAddress, amount, recipientAddress, signer })).resolves.not.toThrow();
    });

    it('should throw an error if transfer tokens from Ethereum to Solana fails', async () => {
      const tokenAddress = 'ethereum-token-address';
      const amount = 100;
      const recipientAddress = 'solana-recipient-address';
      const signer = 'ethereum-signer';

      await expect(crossChainTransfer.transferFromEthToSolana({ tokenAddress, amount, recipientAddress, signer })).rejects.toThrow();
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