const { ethers } = require('ethers');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const bs58 = require('bs58');
const CrossChainTransfer = require('../core/CrossChainTransfer');
const {
    transferFromSolana,
    transferFromEth,
    getSignedVAAWithRetry,
    parseSequenceFromLogSolana,
    parseSequenceFromLogEth,
    postVaaSolana,
    createWrappedOnSolana,
    createWrappedOnEth
} = require('@certusone/wormhole-sdk');

// Mock environment variables
process.env.SOL_TOKEN_BRIDGE_ADDRESS = 'mockSolBridgeAddress';
process.env.ETH_TOKENIDGE_ADDRESS = 'mockEthBridgeAddress';
process.env.WORMHOLE_RPC_HOST = 'mockWormholeRpcHost';
process.env.SOL_BRIDGE_ADDRESS = 'mockSolBridge';
process.env.ETH_BRIDGE_ADDRESS = 'mockEthBridge';
process.env.SOLANA_RPC_URL = 'mockSolanaRpcUrl'; // Added missing environment variable
process.env.ETH_RPC_URL = 'mockEthRpcUrl'; // Added missing environment variable

// Mock private key and addresses
const mockPrivateKey = 'mockPrivateKey';
const mockSolanaAddress = '5K1J6dGHTxZQxBo5gGqr7xC3nHEN9R8j5GkU3Rgkk9hL';
const mockEthereumAddress = '0x1234567890abcdef1234567890abcdef12345678';

// Mock bs58 module
jest.mock('bs58', () => ({
    decode: jest.fn().mockReturnValue(Buffer.from('mockDecodedBuffer')),
}));

jest.mock('ethers');
jest.mock('@solana/web3.js', () => {
    return {
        Connection: jest.fn().mockImplementation(() => ({
            confirmTransaction: jest.fn(),
            getTransaction: jest.fn(),
        })),
        Keypair: {
            fromSecretKey: jest.fn().mockReturnValue({
                publicKey: {
                    toBase58: jest.fn().mockReturnValue('mockPublicKeyBase58'),
                    toBuffer: jest.fn().mockReturnValue(Buffer.from('mockPublicKeyBuffer')),
                    toArrayLike: jest.fn().mockReturnValue(Buffer.from('mockPublicKeyBuffer').toString('hex')),
                    toString: jest.fn().mockReturnValue('mockPublicKeyBase58'),
                },
            }),
            generate: jest.fn().mockReturnValue({
                publicKey: {
                    toBase58: jest.fn().mockReturnValue('mockPublicKeyBase58'),
                    toBuffer: jest.fn().mockReturnValue(Buffer.from('mockPublicKeyBuffer')),
                    toArrayLike: jest.fn().mockReturnValue(Buffer.from('mockPublicKeyBuffer').toString('hex')),
                    toString: jest.fn().mockReturnValue('mockPublicKeyBase58'),
                },
            }),
        },
        PublicKey: jest.fn().mockImplementation(() => ({
            toBase58: jest.fn().mockReturnValue('mockPublicKeyBase58'),
            toBuffer: jest.fn().mockReturnValue(Buffer.from('mockPublicKeyBuffer')),
            toArrayLike: jest.fn().mockReturnValue(Buffer.from('mockPublicKeyBuffer').toString('hex')),
            toString: jest.fn().mockReturnValue('mockPublicKeyBase58'),
        })),
    };
});
jest.mock('@certusone/wormhole-sdk');

// Mock @project-serum/anchor to prevent errors
jest.mock('@project-serum/anchor', () => ({
    AnchorProvider: jest.fn().mockImplementation(() => ({})),
    Program: jest.fn().mockImplementation(() => ({
        account: {
            getAccountInfo: jest.fn(),
        },
        methods: {},
    })),
    web3: {
        SystemProgram: {
            programId: 'mockProgramId',
        },
    },
}));

describe('CrossChainTransfer', () => {
  let transferService;

  beforeEach(() => {
      // Reset all mocks before each test
      ethers.providers.JsonRpcProvider.mockClear();
      ethers.Wallet.mockClear();
      Connection.mockClear();
      Keypair.fromSecretKey.mockClear();
      bs58.decode.mockClear();

      transferService = new CrossChainTransfer(mockPrivateKey);
  });

  test('should initialize Ethereum and Solana providers', () => {
      expect(ethers.providers.JsonRpcProvider).toHaveBeenCalledWith(process.env.ETH_RPC_URL);
      expect(ethers.Wallet).toHaveBeenCalledWith(mockPrivateKey, expect.any(ethers.providers.JsonRpcProvider));
      expect(Connection).toHaveBeenCalledWith(process.env.SOLANA_RPC_URL, 'confirmed');
      expect(Keypair.fromSecretKey).toHaveBeenCalledWith(bs58.decode(mockPrivateKey));
  });

  test('should validate Ethereum address correctly', () => {
      expect(transferService.isValidEthereumAddress(mockEthereumAddress)).toBe(true);
      expect(transferService.isValidEthereumAddress('invalidAddress')).toBe(false);
  });

  test('should validate Solana address correctly', () => {
      expect(transferService.isValidBase58(mockSolanaAddress)).toBe(true);
      expect(transferService.isValidBase58('invalidAddress')).toBe(false);
  });

  test('should throw error if environment variables are missing', () => {
      delete process.env.SOL_TOKEN_BRIDGE_ADDRESS;
      expect(() => {
          new CrossChainTransfer(mockPrivateKey);
      }).toThrow('SOL_TOKEN_BRIDGE_ADDRESS, ETH_TOKEN_BRIDGE_ADDRESS, WORMHOLE_RPC_HOST, SOLANA_RPC_URL, and ETH_RPC_URL must be set in the environment variables.');
  });

  test('should transfer from Solana to Ethereum successfully', async () => {
    // Mock the dependencies
    transferFromSolana.mockResolvedValue({ txid: 'mockTxId' });
    transferService.solanaConnection.confirmTransaction.mockResolvedValue({ txid: 'mockTxId' });
    transferService.solanaConnection.getTransaction.mockResolvedValue({ logs: [] });
    getSignedVAAWithRetry.mockResolvedValue('mockVAA');

    const logSpy = jest.spyOn(console, 'log');

    // Use valid addresses
    const validSolanaTokenAddress = 'So11111111111111111111111111111111111111112'; // Example valid address
    const validEthereumAddress = '0x32Be343B94f860124dC4fEe278FDCBD38C102D88'; // Example valid address

    await transferService.transferFromSolanaToEth({
        tokenAddress: validSolanaTokenAddress,
        amount: '1000',
        recipientAddress: validEthereumAddress,
        tokenName: 'TestToken',
    });

    expect(logSpy).toHaveBeenCalledWith('Transferring 1000 of TestToken from Solana to Ethereum...');
    expect(transferFromSolana).toHaveBeenCalledWith(
        process.env.SOL_TOKEN_BRIDGE_ADDRESS,
        transferService.solanaConnection,
        validSolanaTokenAddress,
        BigInt(1000),
        validEthereumAddress,
        expect.any(Number)
    );
});

  test('should handle error during transfer from Solana to Ethereum', async () => {
      transferFromSolana.mockRejectedValue(new Error('Mock Transfer Error'));

      await expect(
          transferService.transferFromSolanaToEth({
              tokenAddress: 'mockSolanaTokenAddress',
              amount: '1000',
              recipientAddress: mockEthereumAddress,
              tokenName: 'TestToken',
          })
      ).rejects.toThrow('Transfer from Solana to Ethereum failed.');

      expect(transferFromSolana).toHaveBeenCalled();
  });

  test('should throw error if parameters are missing for transfer from Solana to Ethereum', async () => {
      await expect(
          transferService.transferFromSolanaToEth({
              tokenAddress: null,
              amount: '1000',
              recipientAddress: mockEthereumAddress,
              tokenName: 'TestToken',
          })
      ).rejects.toThrow('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');

      await expect(
          transferService.transferFromSolanaToEth({
              tokenAddress: 'mockSolanaTokenAddress',
              amount: null,
              recipientAddress: mockEthereumAddress,
              tokenName: 'TestToken',
          })
      ).rejects.toThrow('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');

      await expect(
          transferService.transferFromSolanaToEth({
              tokenAddress: 'mockSolanaTokenAddress',
              amount: '1000',
              recipientAddress: null,
              tokenName: 'TestToken',
          })
      ).rejects.toThrow('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');
  });

test('should transfer from Ethereum to Solana successfully', async () => {
    const validEthereumTokenAddress = '0x32Be343B94f860124dC4fEe278FDCBD38C102D88'; // Example valid address
    const validSolanaRecipientAddress = 'So11111111111111111111111111111111111111112'; // Example valid address

    const crossChainTransfer = new CrossChainTransfer(mockPrivateKey);

    await expect(crossChainTransfer.transferFromEthToSolana(validEthereumTokenAddress, validSolanaRecipientAddress, amount))
        .resolves
        .not.toThrow();
});

  test('should handle error during transfer from Ethereum to Solana', async () => {
      transferFromEth.mockRejectedValue(new Error('Mock Transfer Error'));

      await expect(
          transferService.transferFromEthToSolana({
              tokenAddress: mockEthereumAddress,
              amount: '1000',
              recipientAddress: 'mockSolanaRecipientAddress',
              tokenName: 'TestToken',
          })
      ).rejects.toThrow('Transfer from Ethereum to Solana failed.');

      expect(transferFromEth).toHaveBeenCalled();
  });

  test('should throw error if parameters are missing for transfer from Ethereum to Solana', async () => {
      await expect(
          transferService.transferFromEthToSolana({
              tokenAddress: null,
              amount: '1000',
              recipientAddress: 'mockSolanaRecipientAddress',
              tokenName: 'TestToken',
          })
      ).rejects.toThrow('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');

      await expect(
          transferService.transferFromEthToSolana({
              tokenAddress: mockEthereumAddress,
              amount: null,
              recipientAddress: 'mockSolanaRecipientAddress',
              tokenName: 'TestToken',
          })
      ).rejects.toThrow('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');

      await expect(
          transferService.transferFromEthToSolana({
              tokenAddress: mockEthereumAddress,
              amount: '1000',
              recipientAddress: null,
              tokenName: 'TestToken',
          })
      ).rejects.toThrow('Invalid parameters: tokenAddress, amount, and recipientAddress are required.');
  });

  test('should post and redeem VAA on Solana successfully', async () => {
      postVaaSolana.mockResolvedValue('mockTxId');
      createWrappedOnSolana.mockResolvedValue('mockTransaction');

      const txSpy = jest.spyOn(transferService, 'signAndSendTransaction').mockResolvedValue('mockTxId');

      await transferService.postAndRedeemOnSolana('mockVAA', 'mockSolanaRecipientAddress');

      expect(postVaaSolana).toHaveBeenCalledWith(
          transferService.solanaConnection,
          process.env.SOL_BRIDGE_ADDRESS,
          'mockVAA'
      );
      expect(createWrappedOnSolana).toHaveBeenCalledWith(
          transferService.solanaConnection,
          process.env.SOL_BRIDGE_ADDRESS,
          process.env.SOL_TOKEN_BRIDGE_ADDRESS,
          'mockVAA',
          'mockSolanaRecipientAddress'
      );
      expect(txSpy).toHaveBeenCalledWith('mockTransaction');
  });

  test('should handle error during VAA post and redeem on Solana', async () => {
      postVaaSolana.mockRejectedValue(new Error('Mock Post Error'));

      await expect(
          transferService.postAndRedeemOnSolana('mockVAA', 'mockSolanaRecipientAddress')
      ).rejects.toThrow('Failed to post and redeem on Solana.');

      expect(postVaaSolana).toHaveBeenCalled();
  });

  test('should create wrapped token on Ethereum successfully', async () => {
      createWrappedOnEth.mockResolvedValue('mockTxId');

      const txSpy = jest.spyOn(transferService, 'sendTransaction').mockResolvedValue('mockTxId');

      await transferService.createWrappedOnEth('mockTokenAddress', BigInt(1000), 'mockEthereumRecipientAddress');

      expect(createWrappedOnEth).toHaveBeenCalledWith(
          transferService.ethSigner,
          process.env.ETH_TOKEN_BRIDGE_ADDRESS,
          'mockTokenAddress',
          BigInt(1000),
          'mockEthereumRecipientAddress'
      );
      expect(txSpy).toHaveBeenCalledWith('mockTxId');
  });

  test('should handle error during wrapped token creation on Ethereum', async () => {
      createWrappedOnEth.mockRejectedValue(new Error('Mock Create Error'));

      await expect(
          transferService.createWrappedOnEth('mockTokenAddress', BigInt(1000), 'mockEthereumRecipientAddress')
      ).rejects.toThrow('Failed to create wrapped token on Ethereum.');

      expect(createWrappedOnEth).toHaveBeenCalled();
  });
});
