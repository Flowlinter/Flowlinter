// __mocks__/@solana/web3.js.js
class Connection {
    constructor() {
      // Mock implementation
    }
  }
  
  class Keypair {
    static generate() {
      return {
        publicKey: {
          toArrayLike: jest.fn().mockReturnValue([]),
          toBuffer: jest.fn().mockReturnValue(Buffer.from([])),
          toBytes: jest.fn().mockReturnValue([]),
          toBase58: jest.fn().mockReturnValue(''),
          toString: jest.fn().mockReturnValue(''),
        },
      };
    }
  }
  
  module.exports = {
    Connection,
    Keypair,
  };