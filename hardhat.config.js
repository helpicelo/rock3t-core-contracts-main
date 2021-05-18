// require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-web3");

require('dotenv').config()

const Web3 = require('web3')
const ContractKit = require('@celo/contractkit')

const web3 = new Web3(process.env.DATAHUB_CELO_TESTNET)
const kit = ContractKit.newKitFromWeb3(web3)

async function awaitWrapper(){
  kit.addAccount(process.env.DEV_ACCOUNT_PKEY)
}
awaitWrapper()


task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.6.12",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    alfajores: {
      provider: kit.connection.web3.currentProvider, // CeloProvider
      network_id: 44787                              // Alfajores network id
    },
  }
};

