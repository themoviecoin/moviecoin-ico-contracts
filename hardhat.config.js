require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");
require('solidity-coverage')

let secret = require("./secret");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  solidity: "0.8.9",
  settings: {
    optimizer: {
      runs: 200,
      enabled: true
    }
  },
  networks: {
    hardhat: {
    },
  //   mainnet:{
  //     // gasPrice : secret.gasPrice * 1000000000,
  //     url: secret.url,
  //     privateKey: [secret.privateKey]
  //   }
  }
};
