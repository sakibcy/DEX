const config = require("../src/config.json");

const { ethers } = require("hardhat");

const tokens = (n) => ethers.utils.parseUnits(n.toString(), "ether");

const wait = (seconds) => {
  const milliseconds = seconds * 1000;
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

async function main() {
  // Fetch accounts from wallet  - those are unlocked
  const accounts = await ethers.getSigners();

  // Fetch network
  const { chainId } = await ethers.provider.getNetwork();
  console.log(`Using chainId: ${chainId}`);

  // Fetched deployed tokens
  const Sakib = await ethers.getContractAt(
    "Token",
    config[chainId].Sakib.address
  );
  console.log(`Sakib token fetched: ${Sakib.address}\n`);

  const Omar = await ethers.getContractAt(
    "Token",
    config[chainId].Omar.address
  );
  console.log(`Omar token fetched: ${Omar.address}\n`);

  const Naga = await ethers.getContractAt(
    "Token",
    config[chainId].Naga.address
  );
  console.log(`Naga token fetched: ${Naga.address}\n`);

  // Fetched the deployed exchange
  const Exchange = await ethers.getContractAt(
    "Exchange",
    config[chainId].Exchange.address
  );
  console.log(`Echange fetched: ${Exchange.address}\n`);

  // Give tokens to account
  const sender = accounts[0];
  const receiver = accounts[1];
  let amount = tokens(10000);

  // user1 transfer 10,000 Omar Token....
  let transaction, result;
  transaction = await Omar.connect(sender).transfer(receiver.address, amount);
  console.log(
    `Transfered ${amount} tokens from ${sender.address} to ${receiver.address}\n`
  );

  // Setup exchange account
  const user1 = accounts[0];
  const user2 = accounts[1];
  amount = tokens(10000);

  // user1 approves 10,000 Sakib token...
  transaction = await Sakib.connect(user1).approve(Exchange.address, amount);
  await transaction.wait();
  console.log(`Approved ${amount} tokens from ${user1.address}`);

  // user1 deposits 10,000 Sakib token...
  transaction = await Exchange.connect(user1).depositToken(
    Sakib.address,
    amount
  );
  await transaction.wait();
  console.log(`Deposited ${amount} Ether from ${user1.address}`);

  // user2 approves Omar token
  transaction = await Omar.connect(user2).approve(Exchange.address, amount);
  await transaction.wait();
  console.log(`Approved ${amount} tokens from ${user2.address}`);

  // user2 deposits Omar token...
  transaction = await Exchange.connect(user2).depositToken(
    Omar.address,
    amount
  );
  await transaction.wait();
  console.log(`Deposited ${amount} tokens from ${user2.address}\n`);

  // user1 makes order to get tokens
  let orderId;
  transaction = await Exchange.connect(user1).makeOrder(
    Omar.address,
    tokens(100),
    Sakib.address,
    tokens(5)
  );
  result = await transaction.wait();
  console.log(`Made order from ${user1.address}\n`);

  // user1 cancels order
  orderId = result.events[0].args.id;
  transaction = await Exchange.connect(user1).cancelOrder(orderId);
  result = await transaction.wait();
  console.log(`Cancelled order from ${user1.address}\n`);

  // wait 1 second
  await wait(1);

  /////////////////////////////
  // Seed filled orders

  // user1 makes order
  transaction = await Exchange.connect(user1).makeOrder(
    Omar.address,
    tokens(100),
    Sakib.address,
    tokens(10)
  );
  result = await transaction.wait();
  console.log(`Make order from ${user1.address}`);

  // user2 fills order
  orderId = result.events[0].args.id;
  transaction = await Exchange.connect(user2).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Filled order from ${user1.address}\n`);

  // wait 1 second
  await wait(1);

  // user1 makes another order
  transaction = await Exchange.connect(user1).makeOrder(
    Omar.address,
    tokens(50),
    Sakib.address,
    tokens(15)
  );
  result = await transaction.wait();
  console.log(`Made order from ${user1.address}`);

  // user2 fills another order
  orderId = result.events[0].args.id;
  transaction = await Exchange.connect(user2).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Filled order from ${user1.address}\n`);

  // wait 1 second
  await wait(1);

  // user1 makes final order
  transaction = await Exchange.connect(user1).makeOrder(
    Omar.address,
    tokens(200),
    Sakib.address,
    tokens(20)
  );
  result = await transaction.wait();
  console.log(`Made final order from ${user1.address}`);

  // user2 fills final order
  orderId = result.events[0].args.id;
  transaction = await Exchange.connect(user2).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Filled final order from ${user1.address}\n`);

  // wait 1 second
  await wait(1);

  ////////////////////////////////
  // Seed open orders

  // user1 makes 10 orders
  for (let i = 1; i <= 10; i++) {
    transaction = await Exchange.connect(user1).makeOrder(
      Omar.address,
      tokens(10 * i),
      Sakib.address,
      tokens(10)
    );
    result = await transaction.wait();

    console.log(`Make order from user1: ${user1.address}\n`);

    // wait 1 second
    await wait(1);
  }

  // user2 makes 10 orders
  for (let i = 1; i <= 10; i++) {
    transaction = await Exchange.connect(user2).makeOrder(
      Sakib.address,
      tokens(10),
      Omar.address,
      tokens(10 * i)
    );
    result = await transaction.wait();

    console.log(`Make order from user2: ${user2.address}\n`);

    // wait 1 second
    await wait(1);
  }

  // Distribute tokens
  // Deposits tokens to exchange
  // Make orders
  // Cancel orders
  // Fill orders
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
