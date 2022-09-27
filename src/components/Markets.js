import React from "react";
import { useDispatch, useSelector } from "react-redux";
import config from "../config.json";
import { loadTokens } from "../store/interactions";

const Markets = () => {
  const chainId = useSelector((state) => state.provider.chainId);
  const provider = useSelector((state) => state.provider.connection);

  const dispatch = useDispatch();

  const marketHandler = async (e) => {
    await loadTokens(provider, e.target.value.split(","), dispatch);
  };

  return (
    <div className="component exchange__markets">
      <div className="component__header">
        <h2>Select Market</h2>
      </div>

      {chainId ? (
        <select name="markets" id="markets" onChange={marketHandler}>
          <option
            value={`${config[chainId].Sakib.address}, ${config[chainId].Omar.address}`}
          >
            Sakib / Omar
          </option>
          <option
            value={`${config[chainId].Sakib.address}, ${config[chainId].Naga.address}`}
          >
            Sakib / Naga
          </option>
        </select>
      ) : (
        <div>
          <p>Not Deployed to Network</p>
        </div>
      )}
      <hr />
    </div>
  );
};

export default Markets;
