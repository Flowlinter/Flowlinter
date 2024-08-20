const { ethers } = require('ethers');
const { getEmitterAddressEth, parseSequenceFromLogEth, getSignedVAAWithRetry, transferFromEth } = require('@certusone/wormhole-sdk');
const { Connection, PublicKey, Transaction, TransactionInstruction } = require('@solana/web3.js');
const dotenv = require('dotenv');

dotenv.config();

class CrossChainTransfer {
    constructor(apiKey, ethRpcUrl, solanaRpcUrl) {
        this.apiKey = apiKey;
        this.ethProvider = new ethers.providers.JsonRpcProvider(ethRpcUrl);
        this.solanaConnection = new Connection(solanaRpcUrl, 'confirmed');
    }

    async transferFromEthToSolana({ tokenAddress, amount, recipientAddress }) {
        try {
            if (!ethers.utils.isAddress(tokenAddress) || !ethers.utils.isAddress(recipientAddress)) {
                throw new Error('Invalid address');
            }

            const tx = await transferFromEth(
                this.ethProvider,
                tokenAddress,
                recipientAddress,
                amount,
                { gasLimit: 500000 }
            );

            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt.transactionHash);

            const sequence = parseSequenceFromLogEth(receipt);
            const emitterAddress = getEmitterAddressEth(tokenAddress);
            const signedVAA = await getSignedVAAWithRetry(this.apiKey, emitterAddress, sequence);

            const solanaTxId = await this.redeemOnSolana(signedVAA, recipientAddress);
            console.log('Tokens redeemed on Solana:', solanaTxId);

            return { ethTxHash: receipt.transactionHash, solanaTxId };
        } catch (error) {
            throw new Error(`Transfer failed: ${error.message}`);
        }
    }

    async redeemOnSolana(signedVAA, recipientAddress) {
        const transaction = new Transaction();
        const redemptionInstruction = this.createRedemptionInstruction(signedVAA, recipientAddress);
        transaction.add(redemptionInstruction);

        const signature = await this.solanaConnection.sendTransaction(transaction, []);
        await this.solanaConnection.confirmTransaction(signature, 'confirmed');

        return signature;
    }

    createRedemptionInstruction(signedVAA, recipientAddress) {
        return new TransactionInstruction({
            programId: new PublicKey('YourWormholeProgramID'),
            keys: [
                { pubkey: new PublicKey(recipientAddress), isSigner: false, isWritable: true },
            ],
            data: Buffer.from(signedVAA),
        });
    }
}

module.exports = CrossChainTransfer;
