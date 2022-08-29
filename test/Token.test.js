const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => ethers.utils.parseUnits(n.toString(), "ether");

describe("Token", () => {
  let token, account, deployer, receiver;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Sakib Token", "SAK", "1000000");

    account = await ethers.getSigners();
    deployer = account[0];
    receiver = account[1];
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

    it("has correct totalSupply", async () => {
      // 1000000000000000000000000
      expect(await token.totalSupply()).equal(totalSupply);
    });

    it("assings total supply to deployer", async () => {
      expect(await token.balanceOf(deployer.address)).equal(totalSupply);
    });
  });

  describe("Sending Token", () => {
    let amount, transaction, result;

    describe("Success", () => {
      beforeEach(async () => {
        amount = tokens(100);
        transaction = await token
          .connect(deployer)
          .transfer(receiver.address, amount);
        result = await transaction.wait();
      });

      it("transfers token balances", async () => {
        expect(await token.balanceOf(deployer.address)).equal(tokens(999900));
        expect(await token.balanceOf(receiver.address)).equal(amount);
      });

      it("emits a transfer event", () => {
        const event = result.events[0];
        expect(event.event).equal("Transfer");

        const args = event.args;
        expect(args.from).equal(deployer.address);
        expect(args.to).equal(receiver.address);
        expect(args.value).equal(amount);
      });
    });

    describe("Failure", () => {
      it("rejects insufficient balances", async () => {
        const invalidAmount = tokens(10000000000);
        await expect(
          token.connect(deployer).transfer(receiver.address, invalidAmount)
        ).to.be.reverted;
      });

      it("rejects ivalid recipent", async () => {
        const amount = tokens(100);
        await expect(
          token
            .connect(deployer)
            .transfer("0x0000000000000000000000000000000000000000", amount)
        ).reverted;
      });
    });
  });
});
