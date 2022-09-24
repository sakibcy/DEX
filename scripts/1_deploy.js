const { ethers } = require("hardhat");

async function main() {
  console.log(`Preparing deployment.....`);

  // Fetch contact to deploy
  const Token = await ethers.getContractFactory("Token");
  const Exchange = await ethers.getContractFactory("Exchange");

  // Fetch accounts
  const accounts = await ethers.getSigners();
  console.log(
    `Accounts fetched:\n${accounts[0].address}\n${accounts[1].address}\n`
  );

  // Deploy contact
  const Sakib = await Token.deploy("Sakib", "SAK", "1000000");
  await Sakib.deployed();
  console.log(`Sakib Deployed to: ${Sakib.address}`);

  const Omar = await Token.deploy("Omar", "OM", "1000000");
  await Omar.deployed();
  console.log(`Omar Deployed to: ${Omar.address}`);

  const Naga = await Token.deploy("Naga", "NG", "1000000");
  await Naga.deployed();
  console.log(`Naga Deployed to: ${Naga.address}`);

  const exchange = await Exchange.deploy(accounts[1].address, 10);
  await exchange.deployed();
  console.log(`Exchange Deployed to: ${exchange.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
