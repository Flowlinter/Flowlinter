// __mocks__/bs58.js
module.exports = {
    decode: jest.fn().mockReturnValue(Buffer.from([])),
  };