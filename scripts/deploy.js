// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
let params = require("../constructor_input");
let input = require('./inputs.json');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Token = await hre.ethers.getContractFactory("Token");
  const token = await Token.deploy(params.name, params.symbol, params.decimals, params.taxPercent, params.totalSupply,
    params.antiWhale, params.whaleAmount, params.owner, params.taxAddresses, params.taxPercentages);

  await token.deployed();

  console.log("Token deployed to:", token.address);

  //n = 4000
  await token.multiSend(input.n1000.usersArray, input.n1000.amountArray, input.n1000.total);
  // const resp  = await token.multiSend(input.n4000.usersArray, input.n4000.amountArray, input.n4000.total);
  // let totalGas = resp.receipt.gasUsed;
  // console.log("gas used : ", totalGas);
  await token.transfer("0x60C1F061B4fd365389dEFa3596FfFC8749D83b3B", "5000000000000000");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });