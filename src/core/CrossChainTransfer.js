// Code to transfer tokens from Ethereum to Solana using Wormhole SDK

// import the required modules and dependencies

import { ethers } from 'ethers';
import { getEmitterAddressEth, parseSequenceFromLogEth, getSignedVAAWithRetry, transferFromEth } from '@certusone/wormhole-sdk';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import dotenv from 'dotenv';

// lode the environment variables using dotenv
dotenv.config();

// define the CrossChainTransfer class to handel transfer from Ethereum to Solana
class CrossChainTransfer { 

    constructor() {
        this.apiKey = process.env.API_KEY; // apiKey is used to interact with the Wormhole API.
        this.ethRpcUrl = process.env.ETH_RPC_URL; // Ethereum RPC URL
        this.solanaRpcUrl = process.env.SOLANA_RPC_URL; // Solana RPC URL
        
        // ethProvider is used to interact with the Ethereum blockchain to validate addresses and facilitate the transaction.  
        this.ethProvider = new ethers.providers.JsonRpcProvider(this.ethRpcUrl);
        // solanaConnection is used to interact with the Solana blockchain to validate addresses and facilitate the transaction.
        this.solanaConnection = new Connection(this.solanaRpcUrl, 'confirmed');
    }
    
        // logic for transferFromEthToSolana method

    async transferFromEthToSolana({ tokenAddress, amount, recipientAddress }) { 

        try { 
            
            if (!ethers.utils.isAddress(tokenAddress) || !ethers.utils.isAddress(recipientAddress)) {
                throw new Error('Invalid address');
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

    async transferFromSolanaToEth({ tokenAddress, recipientAddress, amount }) {

        try {
            const solanaPublicKey = new PublicKey(tokenAddress);
            const ethAddress = recipientAddress;
            // Remove the declaration of tokenAmount

            if (!PublicKey.isOnCurve(solanaPublicKey.toBuffer()) || !ethers.utils.isAddress(ethAddress)) {
                throw new Error('Invalid address');
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

            // Remove the declaration of signers

            return tx.hash;

        } catch (error) {
            console.error('Error transferring from Solana to Ethereum:', error);
        }
    }

    async redeemOnSolana(signedVAA, recipientAddress) { // Add the redeemOnSolana method
        const transaction = new Transaction();
        const redemptionInstruction = this.createRedemptionInstruction(signedVAA, recipientAddress);
        transaction.add(redemptionInstruction);

        const signature = await this.solanaConnection.sendTransaction(transaction);
        await this.solanaConnection.confirmTransaction(signature, 'confirmedFinalized');

        return signature;
    }

    createRedemptionInstruction(signedVAA, recipientAddress) {
        return new TransactionInstruction({
            programId: new PublicKey('YourWormholeProgramID'), //  Wormhole program ID on Solana mainnet or devnet 
            keys: [
                { pubkey: new PublicKey(recipientAddress), isSigner: false, isWritable: true },
            ],
            data: Buffer.from(signedVAA),
        });
    }
}

module.exports = CrossChainTransfer; // the CrossChainTransfer class is exported 

