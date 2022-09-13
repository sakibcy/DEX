/* eslint-disable jest/valid-describe-callback */
/* eslint-disable jest/valid-expect */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => ethers.utils.parseUnits(n.toString(), "ether");

describe("Exchange", () => {
  let exchange, accounts, deployer, feeAccount, token1, user1;

  const feePercent = 10;

  beforeEach(async () => {
    const Exchange = await ethers.getContractFactory("Exchange");
    const Token = await ethers.getContractFactory("Token");

    token1 = await Token.deploy("Sakib Token", "SAK", "1000000");

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    feeAccount = accounts[1];
    user1 = accounts[2];

    let transaction = await token1
      .connect(deployer)
      .transfer(user1.address, tokens(100));
    await transaction.wait();

    exchange = await Exchange.deploy(feeAccount.address, feePercent);
  });

  describe("Deployment", () => {
    it("tracks the fee account", async () => {
      expect(await exchange.feeAccount()).equal(feeAccount.address);
    });

    it("tracks the fee percent", async () => {
      expect(await exchange.feePercent()).equal(feePercent);
    });
  });

  describe("Depositing Tokens", () => {
    let transaction, result;
    let amount = tokens(10);

    beforeEach(async () => {
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);
      result = await transaction.wait();

      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount);
      result = await transaction.wait();
    });

    describe("Success", () => {
      it("tracks the token deposit", async () => {
        expect(await token1.balanceOf(exchange.address)).equal(amount);
        expect(await exchange.tokens(token1.address, user1.address)).equal(
          amount
        );
        expect(await exchange.balanceOf(token1.address, user1.address)).equal(
          amount
        );
      });

      it("emits a Desposit event", async () => {
        const event = result.events[1];
        expect(event.event).equal("Deposit");

        const args = event.args;
        expect(args.token).equal(token1.address);
        expect(args.user).equal(user1.address);
        expect(args.amount).equal(amount);
        expect(args.balance).equal(amount);
      });
    });
    describe("Failure", () => {
      it("fails when no tokens are approved", async () => {
        await expect(
          exchange.connect(user1).depositToken(token1.address, amount)
        ).reverted;
      });
    });
  });
});
