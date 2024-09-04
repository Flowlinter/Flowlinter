import { wormhole, Signer } from "@wormhole-foundation/sdk";
import evm from "@wormhole-foundation/sdk/evm";
import solana from "@wormhole-foundation/sdk/solana";

class CrossChainTransferSDK {
  private wh: any;

  constructor() {}

  async initialize(network: string) {
    this.wh = await wormhole(network, [evm, solana]);
  }

  async transferTokens(
    sourceChain: string,
    destinationChain: string,
    tokenAddress: string,
    amount: bigint,
    senderAddress: string,
    receiverAddress: string,
    signer: Signer
  ) {
    // Create TokenTransfer object
    const xfer = await this.wh.tokenTransfer(
      tokenAddress,
      amount,
      { chain: sourceChain, address: senderAddress },
      { chain: destinationChain, address: receiverAddress },
      false, // automatic delivery
      undefined, // payload
      undefined // native gas
    );

    // Initiate transfer on source chain
    console.log("Starting transfer");
    const srcTxids = await xfer.initiateTransfer(signer);
    console.log(`Started transfer: `, srcTxids);

    // Fetch attestation (VAA)
    console.log("Getting Attestation");
    const attestIds = await xfer.fetchAttestation(60_000);
    console.log(`Got Attestation: `, attestIds);

    // Complete transfer on destination chain
    console.log("Completing Transfer");
    const destTxids = await xfer.completeTransfer(signer);
    console.log(`Completed Transfer: `, destTxids);
  }
}

export default CrossChainTransferSDK;