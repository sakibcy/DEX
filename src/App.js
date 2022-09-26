import { useEffect } from "react";
import config from "./config.json";
import "./App.css";
import { useDispatch } from "react-redux";
import {
  loadAccount,
  loadNetwork,
  loadProvider,
  loadToken,
} from "./store/interactions";

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    await loadAccount(dispatch);

    // connect ethers to blockchain
    const provider = loadProvider(dispatch);

    const chainId = await loadNetwork(provider, dispatch);

    // Token smart contract
    await loadToken(provider, config[chainId].Sakib.address, dispatch);
  };

  useEffect(() => {
    loadBlockchainData();
  });

  return (
    <div>
      {/* Navbar */}

      <main className="exchange grid">
        <section className="exchange__section--left grid">
          {/* Markets */}

          {/* Balance */}

          {/* Order */}
        </section>
        <section className="exchange__section--right grid">
          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}
        </section>
      </main>

      {/* Alert */}
    </div>
  );
}

export default App;
