const path = require("path");
require("dotenv").config({ path: "./.env" });
const HDWalletProvider = require("@truffle/hdwallet-provider");
const MetaMaskAccountIndex = 0;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  plugins: ["truffle-plugin-verify"],
  api_keys: {
    etherscan: ETHERSCAN_API_KEY
  },
  contracts_build_directory: path.join(__dirname, "../client/src/contracts"),
  networks: {
    development: {
      port: 7545,
      network_id: "*",
      host: "127.0.0.1",
    },
    ganache_local: {
      provider: function () {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          "http://127.0.0.1:7545",
          MetaMaskAccountIndex
        );
      },
      network_id: 5777,
    },
    goerli_infura: {
      provider: function () {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          `https://goerli.infura.io/v3/${process.env.API_KEY}`,
          MetaMaskAccountIndex
        );
      },
      network_id: 5,
      gas: 5500000, // Adjust this based on your contract's gas consumption
      gasPrice: 20000000000,
    },
    sepolia: {
      provider: function () {
        return new HDWalletProvider(
          process.env.MNEMONIC,
          `https://sepolia.infura.io/v3/${process.env.API_KEY}`,
          MetaMaskAccountIndex
        );
      },
      network_id: 11155111,
      gas: 5500000, // Adjust this based on your contract's gas consumption
      gasPrice: 20000000000,
      
    },
  },
 
  compilers: {
    solc: {
      version: "0.7.6",
    },
  },
};
