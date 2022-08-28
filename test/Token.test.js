const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => ethers.utils.parseUnits(n.toString(), "ether");

describe("Token", () => {
  let token;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Sakib Token", "SAK", "1000000");
  });

  describe("Deployment", () => {
    const name = "Sakib Token";
    const symbol = "SAK";
    const decimals = 18;
    const totalSupply = tokens("1000000");

    it("should return name of the Token", async () => {
      // Read token name
      // Check the name is correct
      expect(await token.name()).equal(name);
    });

    it("should return symbol of token", async () => {
      expect(await token.symbol()).equal(symbol);
    });

    it("has correct decimals", async () => {
      expect(await token.decimals()).equal(decimals);
    });

    it("has correct totalSUpply", async () => {
      // 1000000000000000000000000
      expect(await token.totalSupply()).equal(totalSupply);
    });
  });
});
