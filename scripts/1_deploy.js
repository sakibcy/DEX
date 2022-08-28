const { ethers } = require("hardhat");

async function main() {
  // Fetch contact to deploy
  const Token = await ethers.getContractFactory("Token");

  // Deploy contact
  const token = await Token.deploy();
  await token.deployed();
  console.log(`Token Deployed to: ${token.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
