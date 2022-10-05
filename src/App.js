import { useEffect } from "react";
import config from "./config.json";
import "./App.css";
import { useDispatch } from "react-redux";
import {
  loadAccount,
  loadAllOrders,
  loadExchange,
  loadNetwork,
  loadProvider,
  loadTokens,
  subscribeToEvents,
} from "./store/interactions";
import Navbar from "./components/Navbar";
import Markets from "./components/Markets";
import Balance from "./components/Balance";
import Order from "./components/Order";
import OrderBook from "./components/OrderBook";
import PriceChart from "./components/PriceChart";

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    // connect ethers to blockchain
    const provider = loadProvider(dispatch);

    // Fetch current network's chainId (e.g. hardhat: 31337, kovan: 42)
    const chainId = await loadNetwork(provider, dispatch);

    // Reload page when network changes
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    // Fetch current account & balance from Metamask when account changed
    window.ethereum.on("accountsChanged", async () => {
      await loadAccount(provider, dispatch);
    });

    // Load Token smart contract
    const Sakib = config[chainId].Sakib;
    const Omar = config[chainId].Omar;
    await loadTokens(provider, [Sakib.address, Omar.address], dispatch);

    // Load Exchange Smart Contract
    const Exchange = config[chainId].Exchange;
    const exchange = await loadExchange(provider, Exchange.address, dispatch);

    // Fetch all orders: open, filled, cancelled
    loadAllOrders(provider, exchange, dispatch);

    // Listen to events
    subscribeToEvents(exchange, dispatch);
  };

  useEffect(() => {
    loadBlockchainData();
  });

  return (
    <div>
      <Navbar />

      <main className="exchange grid">
        <section className="exchange__section--left grid">
          <Markets />

          <Balance />

          <Order />
        </section>
        <section className="exchange__section--right grid">
          <PriceChart />

          {/* Transactions */}

          {/* Trades */}

          <OrderBook />
        </section>
      </main>

      {/* Alert */}
    </div>
  );
}

export default App;
