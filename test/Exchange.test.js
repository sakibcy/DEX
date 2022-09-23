/* eslint-disable jest/valid-describe-callback */
/* eslint-disable jest/valid-expect */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => ethers.utils.parseUnits(n.toString(), "ether");

describe("Exchange", () => {
  let exchange, accounts, deployer, feeAccount, token1, token2, user1, user2;

  const feePercent = 10;

  beforeEach(async () => {
    const Exchange = await ethers.getContractFactory("Exchange");
    const Token = await ethers.getContractFactory("Token");

    token1 = await Token.deploy("Sakib Token", "SAK", "1000000");
    token2 = await Token.deploy("Omar Token", "OM", "1000000");

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    feeAccount = accounts[1];
    user1 = accounts[2];
    user2 = accounts[3];

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

  describe("Withdrawing Tokens", () => {
    let transaction, result;
    let amount = tokens(10);

    describe("Success", () => {
      beforeEach(async () => {
        // Approve Token
        transaction = await token1
          .connect(user1)
          .approve(exchange.address, amount);
        result = await transaction.wait();

        // Deposite token
        transaction = await exchange
          .connect(user1)
          .depositToken(token1.address, amount);
        result = await transaction.wait();

        // Withdraw Tokens
        transaction = await exchange
          .connect(user1)
          .withdrawToken(token1.address, amount);
        result = await transaction.wait();
      });

      it("withdraws tokens funds", async () => {
        expect(await token1.balanceOf(exchange.address)).equal(0);
        expect(await exchange.tokens(token1.address, user1.address)).equal(0);
        expect(await exchange.balanceOf(token1.address, user1.address)).equal(
          0
        );
      });

      it("emits a Withdraw event", async () => {
        const event = result.events[1];
        expect(event.event).equal("Withdraw");

        const args = event.args;
        expect(args.token).equal(token1.address);
        expect(args.user).equal(user1.address);
        expect(args.amount).equal(amount);
        expect(args.balance).equal(0);
      });
    });

    describe("Failure", () => {
      it("fails for insufficient balances", async () => {
        await expect(
          exchange.connect(user1).withdrawToken(token1.address, amount)
        ).reverted;
      });
    });
  });

  describe("Checking Balances", () => {
    let transaction;
    let amount = tokens(1);

    beforeEach(async () => {
      // Approve Token
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);

      // Deposite token
      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount);
    });

    it("returns user balance", async () => {
      expect(await exchange.balanceOf(token1.address, user1.address)).equal(
        amount
      );
    });
  });

  describe("Making orders", async () => {
    let transaction, result;
    let amount = tokens(1);

    describe("Success", async () => {
      beforeEach(async () => {
        // Deposit tokens before making order

        // Approve Token
        transaction = await token1
          .connect(user1)
          .approve(exchange.address, amount);
        result = await transaction.wait();

        // Deposit token
        transaction = await exchange
          .connect(user1)
          .depositToken(token1.address, amount);
        result = await transaction.wait();

        // Make order
        transaction = await exchange
          .connect(user1)
          .makeOrder(token2.address, amount, token1.address, amount);
        result = await transaction.wait();
      });

      it("Tracks the newly created order", async () => {
        expect(await exchange.orderCount()).equal(1);
      });

      it("emits an Order event", () => {
        const event = result.events[0];
        expect(event.event).equal("Order");

        const args = event.args;
        expect(args.id).equal(1);
        expect(args.user).equal(user1.address);
        expect(args.tokenGet).equal(token2.address);
        expect(args.amountGet).equal(tokens(1));
        expect(args.tokenGive).equal(token1.address);
        expect(args.amountGive).equal(tokens(1));
        expect(args.timestamp).least(1);
      });
    });

    describe("Failure", async () => {
      it("rejects with no balance", async () => {
        await expect(
          exchange
            .connect(user1)
            .makeOrder(token1.address, tokens(1), token2.address, tokens(1))
        ).reverted;
      });
    });
  });

  describe("Order actions", async () => {
    let transaction, result;
    let amount = tokens(1);

    beforeEach(async () => {
      // Deposit tokens before making order

      // Approve Token
      transaction = await token1
        .connect(user1)
        .approve(exchange.address, amount);
      result = await transaction.wait();

      // Deposit token
      transaction = await exchange
        .connect(user1)
        .depositToken(token1.address, amount);
      result = await transaction.wait();

      // Give tokens to user2
      transaction = await token2
        .connect(deployer)
        .transfer(user2.address, tokens(100));
      result = await transaction.wait();

      // user2 deposits tokens
      transaction = await token2
        .connect(user2)
        .approve(exchange.address, tokens(2));
      result = await transaction.wait();

      transaction = await exchange
        .connect(user2)
        .depositToken(token2.address, tokens(2));
      result = await transaction.wait();

      // Make order
      transaction = await exchange
        .connect(user1)
        .makeOrder(token2.address, amount, token1.address, amount);
      result = await transaction.wait();
    });

    describe("Cancelling orders", async () => {
      describe("Success", async () => {
        beforeEach(async () => {
          transaction = await exchange.connect(user1).cancelOrder(1);
          result = await transaction.wait();
        });

        it("updates canceled order", async () => {
          expect(await exchange.connect(user1).orderCancelled(1)).equal(true);
        });

        it("emits an Cancel event", () => {
          const event = result.events[0];
          expect(event.event).equal("CancelOrder");

          const args = event.args;
          expect(args.id).equal(1);
          expect(args.user).equal(user1.address);
          expect(args.tokenGet).equal(token2.address);
          expect(args.amountGet).equal(tokens(1));
          expect(args.tokenGive).equal(token1.address);
          expect(args.amountGive).equal(tokens(1));
          expect(args.timestamp).least(1);
        });
      });

      describe("Failure", async () => {
        beforeEach(async () => {
          // Deposit tokens before making order

          // Approve Token
          transaction = await token1
            .connect(user1)
            .approve(exchange.address, amount);
          result = await transaction.wait();

          // Deposit token
          transaction = await exchange
            .connect(user1)
            .depositToken(token1.address, amount);
          result = await transaction.wait();

          // Make order
          transaction = await exchange
            .connect(user1)
            .makeOrder(token2.address, amount, token1.address, amount);
          result = await transaction.wait();
        });

        it("rejects invalid order ids", async () => {
          await expect(exchange.connect(user1).cancelOrder(777)).reverted;
        });

        it("rejects unauthorized cancellations", async () => {
          await expect(exchange.connect(user2).cancelOrder(1)).reverted;
        });
      });
    });

    describe("Filling orders", async () => {
      describe("Success", () => {
        beforeEach(async () => {
          transaction = await exchange.connect(user2).fillOrder(1);
          result = await transaction.wait();
        });

        it("executes the trade and charge fees", async () => {
          // Token Give
          expect(
            await exchange.balanceOf(token1.address, user1.address)
          ).to.equal(tokens(0));
          expect(
            await exchange.balanceOf(token1.address, user2.address)
          ).to.equal(tokens(1));
          expect(
            await exchange.balanceOf(token1.address, feeAccount.address)
          ).to.equal(tokens(0));
          // Token get
          expect(
            await exchange.balanceOf(token2.address, user1.address)
          ).to.equal(tokens(1));
          expect(
            await exchange.balanceOf(token2.address, user2.address)
          ).to.equal(tokens(0.9));
          expect(
            await exchange.balanceOf(token2.address, feeAccount.address)
          ).to.equal(tokens(0.1));
        });

        it("updates filled orders", async () => {
          expect(await exchange.orderFilled(1)).equal(true);
        });

        it("emits a Trade event", async () => {
          const event = result.events[0];
          expect(event.event).equal("Trade");

          const args = event.args;
          expect(args.id).equal(1);
          expect(args.user).equal(user2.address);
          expect(args.tokenGet).equal(token2.address);
          expect(args.amountGet).equal(tokens(1));
          expect(args.tokenGive).equal(token1.address);
          expect(args.amountGive).equal(tokens(1));
          expect(args.creator).equal(user1.address);
          expect(args.timestamp).least(1);
        });
      });

      describe("Failure", () => {
        it("rejects invalid order ids", async () => {
          const invalidOrderId = 9999;
          await expect(exchange.connect(user2).fillOrder(invalidOrderId))
            .reverted;
        });

        it("rejects already filled order", async () => {
          transaction = await exchange.connect(user2).fillOrder(1);
          await transaction.wait();

          await expect(exchange.connect(user2).fillOrder(1)).reverted;
        });

        it("rejects canceled order", async () => {
          transaction = await exchange.connect(user1).cancelOrder(1);
          await transaction.wait();

          await expect(exchange.connect(user2).fillOrder(1)).reverted;
        });
      });
    });
  });
  /////
});
