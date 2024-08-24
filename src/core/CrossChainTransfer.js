// Code to transfer tokens from Ethereum to Solana using Wormhole SDK

// Import the required modules and dependencies
import { ethers } from 'ethers';
import { getEmitterAddressEth, parseSequenceFromLogEth, getSignedVAAWithRetry, transferFromEth } from '@certusone/wormhole-sdk';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import dotenv from 'dotenv';

// Load the environment variables using dotenv
dotenv.config();

// Define the CrossChainTransfer class to handle transfer from Ethereum to Solana
class CrossChainTransfer { 

    constructor() {
        this.apiKey = process.env.API_KEY; // API key is used to interact with the Wormhole API.
        this.ethRpcUrl = process.env.ETH_RPC_URL; // Ethereum RPC URL
        this.solanaRpcUrl = process.env.SOLANA_RPC_URL; // Solana RPC URL
        
        // ethProvider is used to interact with the Ethereum blockchain to validate addresses and facilitate the transaction.  
        this.ethProvider = new ethers.providers.JsonRpcProvider(this.ethRpcUrl);
        // solanaConnection is used to interact with the Solana blockchain to validate addresses and facilitate the transaction.
        this.solanaConnection = new Connection(this.solanaRpcUrl, 'confirmed');
    }
    
// Logic for transferFromEthToSolana method
async transferFromEthToSolana({ tokenAddress, amount, recipientAddress }) { 
    try { 
        console.log('Token Address:', tokenAddress);
        console.log('Recipient Address:', recipientAddress);

        if (!ethers.utils.isAddress(tokenAddress)) {
            throw new Error('Invalid token address');
        }

        if (!ethers.utils.isAddress(recipientAddress)) {
            throw new Error('Invalid recipient address');
        }

        const tx = await transferFromEth( // Call the transferFromEth function
            this.ethProvider,
            tokenAddress,
            recipientAddress,
            amount,
            { gasLimit: 500000 } 
        );

        const receipt = await tx.wait();

        // Log the Ethereum transaction hash
        console.log('Transaction confirmed:', receipt.transactionHash);

        // Parse the sequence from the Ethereum transaction log
        const sequence = parseSequenceFromLogEth(receipt);

        // Get the emitter address and the signed VAA
        const emitterAddress = getEmitterAddressEth(tokenAddress);

        // Get the signed VAA with retries
        const signedVAA = await getSignedVAAWithRetry(this.apiKey, emitterAddress, sequence);

        // Redeem the tokens on Solana
        const solanaTxId = await this.redeemOnSolana(signedVAA, recipientAddress);

        console.log('Tokens redeemed on Solana:', solanaTxId);

        return { ethTxHash: receipt.transactionHash, solanaTxId };
        
    } catch (error) {
        throw new Error(`Transfer failed: ${error.message}`);
    }
}

    // Logic for transferFromSolanaToEth method

    async transferFromSolanaToEth({ tokenAddress, recipientAddress }) {
        try {
            // Log the input addresses for debugging
            console.log('Token Address:', tokenAddress);
            console.log('Recipient Address:', recipientAddress);
    
            // Validate the token address and recipient address
            if (!tokenAddress || !recipientAddress) {
                throw new Error('Token address and recipient address must be provided');
            }
    
            // Validate the Solana public key format
            if (!this.isValidBase58(tokenAddress)) {
                throw new Error('Invalid base58 format for Solana token address');
            }
    
            const solanaPublicKey = new PublicKey(tokenAddress);
            const ethAddress = recipientAddress;
    
            // Validate the Solana public key and Ethereum address
            if (!PublicKey.isOnCurve(solanaPublicKey.toBuffer())) {
                throw new Error('Invalid Solana public key');
            }
            if (!ethers.utils.isAddress(ethAddress)) {
                throw new Error('Invalid Ethereum address');
            }
    
            // Create and sign the transaction on Solana
            const transaction = new Transaction().add(
                // Solana transfer instruction here
                new TransactionInstruction({
                    keys: [{ pubkey: solanaPublicKey, isSigner: true, isWritable: true }],
                    programId: new PublicKey('YourProgramId'),
                    data: Buffer.from([]) // Add your instruction data here
                })
            );
    
            const { blockhash } = await this.solanaConnection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = solanaPublicKey;
    
            // Sign the transaction
            const signedTransaction = await this.solanaConnection.sendTransaction(transaction);
    
            // Send the transaction
            const txHash = await this.solanaConnection.sendRawTransaction(signedTransaction.serialize());
    
            return txHash;
    
        } catch (error) {
            console.error('Error transferring from Solana to Ethereum:', error);
            throw error; // Re-throw the error after logging it
        }
    }
    
    // Function to validate base58 strings
    isValidBase58(str) {
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
        return base58Regex.test(str);
    }
    
    // Add the redeemOnSolana method
    async redeemOnSolana(signedVAA, recipientAddress) {
        const transaction = new Transaction();
        const redemptionInstruction = this.createRedemptionInstruction(signedVAA, recipientAddress);
        transaction.add(redemptionInstruction);

        const signature = await this.solanaConnection.sendRawTransaction(transaction);
        await this.solanaConnection.confirmTransaction(signature, 'confirmedFinalized');

        return signature;
    }

    createRedemptionInstruction(signedVAA, recipientAddress) {
        return new TransactionInstruction({
            programId: new PublicKey('YourWormholeProgramID'), // Wormhole program ID on Solana mainnet or devnet 
            keys: [
                { pubkey: new PublicKey(recipientAddress), isSigner: false, isWritable: true },
            ],
            data: Buffer.from(signedVAA),
        });
    }
}

module.exports = CrossChainTransfer; // Export the CrossChainTransfer class
