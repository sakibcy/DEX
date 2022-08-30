/* eslint-disable jest/valid-describe-callback */
/* eslint-disable jest/valid-expect */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => ethers.utils.parseUnits(n.toString(), "ether");

describe("Token", () => {
  let token, account, deployer, receiver, exchange;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Sakib Token", "SAK", "1000000");

    account = await ethers.getSigners();
    deployer = account[0];
    receiver = account[1];
    exchange = account[2];
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

  describe("Approving Tokens", () => {
    let amount, transaction, result;

    beforeEach(async () => {
      amount = tokens(100);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, amount);
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("allocates an allowance for delefated token spending", async () => {
        expect(await token.allowance(deployer.address, exchange.address)).equal(
          amount
        );
      });

      it("emits an Approval event", async () => {
        const event = result.events[0];
        expect(event.event).equal("Approval");

        const args = event.args;
        expect(args.owner).equal(deployer.address);
        expect(args.spender).equal(exchange.address);
        expect(args.value).equal(amount);
      });
    });

    describe("Failure", () => {
      it("rejects invalid spenders", async () => {
        await expect(
          token
            .connect(deployer)
            .approve("0x0000000000000000000000000000000000000000", amount)
        ).reverted;
      });
    });
  });

  describe("Delegated Token Transfer", () => {
    let amount, transaction, result;

    beforeEach(async () => {
      amount = tokens(100);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, amount);
      result = await transaction.wait();
    });

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amount);
        result = await transaction.wait();
      });

      it("transfers token balances", async () => {
        expect(await token.balanceOf(deployer.address)).equal(
          ethers.utils.parseUnits("999900", "ether")
        );
        expect(await token.balanceOf(receiver.address)).equal(amount);
      });

      it("resets the allowance", async () => {
        expect(await token.allowance(deployer.address, exchange.address)).equal(
          0
        );
      });

      it("emits a Transfer event", async () => {
        const event = result.events[0];
        expect(event.event).equal("Transfer");

        const args = event.args;
        expect(args.from).equal(deployer.address);
        expect(args.to).equal(receiver.address);
        expect(args.value).equal(amount);
      });
    });

    describe("Failure", async () => {
      const invalidAmount = tokens(1000000000);
      await expect(
        token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, invalidAmount)
      ).reverted;
    });
  });
});
