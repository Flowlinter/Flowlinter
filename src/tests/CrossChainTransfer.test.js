require('dotenv').config();
jest.mock('@certusone/wormhole-sdk', () => ({
    transferFromSolana: jest.fn(),
    getSignedVAAWithRetry: jest.fn(),
    parseSequenceFromLogSolana: jest.fn(),
    transferFromEth: jest.fn(),
    parseSequenceFromLogEth: jest.fn(),
    postVaaSolana: jest.fn(),
    createWrappedOnSolana: jest.fn(),
    createWrappedOnEth: jest.fn(),
}));
jest.mock('@solana/web3.js', () => {
    return {
        Connection: jest.fn(),
        Keypair: {
            fromSecretKey: jest.fn()
        },
        PublicKey: jest.fn(), // Mock PublicKey constructor
    };
});
jest.mock('ethers');
jest.mock('bs58');
jest.mock('../utils/utils', () => ({
  validateParams: jest.fn(),
  logInfo: jest.fn(),
  logError: jest.fn(), // Add mock for logError
}));

const { ethers } = require('ethers');
const { Connection, Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const {
    transferFromSolana,
    getSignedVAAWithRetry,
    parseSequenceFromLogSolana,
    transferFromEth,
    parseSequenceFromLogEth,
    postVaaSolana,
    createWrappedOnSolana,
    createWrappedOnEth
} = require('@certusone/wormhole-sdk');

const CrossChainTransfer = require('../core/CrossChainTransfer');
const Utils = require('../utils/utils'); // Assuming you have a utils module for logging and validation

// Describe the test suite
describe('CrossChainTransfer', () => { 
    let crossChainTransfer;
    const privateKey = 'testPrivateKey';
    const mockedSolanaKeypair = { publicKey: 'mockedPublicKey' };

    // Mock the necessary functions and classes
    beforeEach(() => {
        Connection.mockImplementation(() => ({
            sendTransaction: jest.fn(),
            confirmTransaction: jest.fn(),
            getTransaction: jest.fn(),
        }));

        ethers.providers.JsonRpcProvider.mockImplementation(() => ({
            getSigner: jest.fn().mockReturnValue({
                privateKey: privateKey
            })
        }));

        ethers.Wallet.mockImplementation((pk, provider) => ({
            privateKey: pk,
            provider: provider
        }));

        Keypair.fromSecretKey.mockReturnValue(mockedSolanaKeypair);
        crossChainTransfer = new CrossChainTransfer(privateKey);

    });

    // Clear mocks after each test
    afterEach(() => {
        jest.clearAllMocks();
    });

    // Write your tests here
    test('should initialize Ethereum provider and signer', () => {
        expect(ethers.providers.JsonRpcProvider).toHaveBeenCalledWith(process.env.ETH_RPC_URL);
        expect(crossChainTransfer.ethSigner.privateKey).toEqual(privateKey);
    });

    test('should initialize Solana connection and Keypair', () => {
        expect(Connection).toHaveBeenCalledWith(process.env.SOLANA_RPC_URL, 'confirmed');
        expect(crossChainTransfer.solanaKeypair).toEqual(mockedSolanaKeypair);
    });

    test('should transfer from Solana to Ethereum successfully', async () => {
        const params = {
            tokenAddress: 'testSolanaTokenAddress',
            amount: '1000000000',
            recipientAddress: '0x1234567890abcdef1234567890abcdef12345678',
            tokenName: 'TestToken'
        };
    
        // Mocking the necessary functions and their return values
        Utils.validateParams.mockReturnValue(true);
        crossChainTransfer.solanaConnection.transferFromSolana = jest.fn().mockResolvedValue('testTransactionId');
        crossChainTransfer.solanaConnection.getTransaction = jest.fn().mockResolvedValue({ logs: [] });
        parseSequenceFromLogSolana.mockReturnValue('testSequence');
        getSignedVAAWithRetry.mockResolvedValue('testSignedVAA');
        crossChainTransfer.redeemOnEth = jest.fn().mockResolvedValue('redeemSuccess');
    
        // Mocking logInfo to verify logging
        Utils.logInfo = jest.fn();
    
        // Execute the transfer function
        await crossChainTransfer.transferFromSolanaToEth(params);
    
        // Verify that the logs contain the expected messages
        expect(Utils.logInfo).toHaveBeenCalledWith(expect.stringContaining('Starting transfer of 10 TestToken from Solana to Ethereum...'));
        expect(Utils.logInfo).toHaveBeenCalledWith(expect.stringContaining('Transfer from Solana to Ethereum completed successfully.'));
    });

    test('should handle errors during transfer from Solana to Ethereum', async () => {
        const params = {
            tokenAddress: 'testSolanaTokenAddress',
            amount: '1000000000',
            recipientAddress: '0x1234567890abcdef1234567890abcdef12345678',
            tokenName: 'TestToken'
        };

        Utils.validateParams.mockReturnValue(true);
        transferFromSolana.mockRejectedValue(new Error('Transfer failed'));

        await expect(crossChainTransfer.transferFromSolanaToEth(params)).rejects.toThrow('Transfer from Solana to Ethereum failed.');

        expect(Utils.logError).toHaveBeenCalledWith(expect.stringContaining('Error during TestToken transfer from Solana to Ethereum:'), expect.any(Error));
    });

    test('should transfer from Ethereum to Solana successfully', async () => {
        const params = {
            tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
            amount: '1000000000',
            recipientAddress: 'testSolanaRecipientAddress',
            tokenName: 'TestToken'
        };

        Utils.validateParams.mockReturnValue(true);
        transferFromEth.mockResolvedValue({
            wait: jest.fn().mockResolvedValue('mockReceipt')
        });
        parseSequenceFromLogEth.mockReturnValue('testSequence');
        getSignedVAAWithRetry.mockResolvedValue('testSignedVAA');
        crossChainTransfer.postAndRedeemOnSolana = jest.fn();

        await crossChainTransfer.transferFromEthToSolana(params);

        expect(Utils.logInfo).toHaveBeenCalledWith(expect.stringContaining('Starting transfer of 1000000000 TestToken from Ethereum to Solana...'));
        expect(transferFromEth).toHaveBeenCalled();
        expect(crossChainTransfer.postAndRedeemOnSolana).toHaveBeenCalledWith('testSignedVAA', params.recipientAddress);
    });

    test('should handle errors during transfer from Ethereum to Solana', async () => {
        const params = {
            tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
            amount: '1000000000',
            recipientAddress: 'testSolanaRecipientAddress',
            tokenName: 'TestToken'
        };

        Utils.validateParams.mockReturnValue(true);
        transferFromEth.mockRejectedValue(new Error('Transfer failed'));

        await expect(crossChainTransfer.transferFromEthToSolana(params)).rejects.toThrow('Transfer from Ethereum to Solana failed.');

        expect(Utils.logError).toHaveBeenCalledWith(expect.stringContaining('Error during TestToken transfer from Ethereum to Solana:'), expect.any(Error));
    });

    test('should validate parameters before transfer', async () => {
        const params = {
            tokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
            amount: '1000000000',
            recipientAddress: 'testSolanaRecipientAddress',
            tokenName: 'TestToken'
        };

        Utils.validateParams.mockReturnValue(false);

        await expect(crossChainTransfer.transferFromEthToSolana(params)).rejects.toThrow('Invalid parameters');

        expect(Utils.validateParams).toHaveBeenCalledWith(params);
        expect(Utils.logError).toHaveBeenCalledWith(expect.stringContaining('Invalid parameters for transfer'));
    });

    test('should log info during transfer process', async () => {
        const params = {
            tokenAddress: 'testSolanaTokenAddress',
            amount: '1000000000',
            recipientAddress: '0x1234567890abcdef1234567890abcdef12345678',
            tokenName: 'TestToken'
        };

        Utils.validateParams.mockReturnValue(true);
        transferFromSolana.mockResolvedValue('testTransactionId');
        crossChainTransfer.solanaConnection.getTransaction.mockResolvedValue({ logs: [] });
        parseSequenceFromLogSolana.mockReturnValue('testSequence');
        getSignedVAAWithRetry.mockResolvedValue('testSignedVAA');
        crossChainTransfer.redeemOnEth = jest.fn();

        await crossChainTransfer.transferFromSolanaToEth(params);

        expect(Utils.logInfo).toHaveBeenCalledWith(expect.stringContaining('Starting transfer of 1000000000 TestToken from Solana to Ethereum...'));
        expect(Utils.logInfo).toHaveBeenCalledWith(expect.stringContaining('Transfer from Solana to Ethereum completed successfully.'));
    });
});