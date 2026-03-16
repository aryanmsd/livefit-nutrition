import { createContext, useState } from "react";
import API from "../services/api";

type CoinsContextType = {
  coins: number;
  setCoins: (n: number) => void;
  refreshCoins: () => Promise<void>;
};

export const CoinsContext = createContext<CoinsContextType>({
  coins: 0,
  setCoins: () => {},
  refreshCoins: async () => {}
});

export function CoinsProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState(0);

  const refreshCoins = async () => {
    try {
      const res = await API.get("/api/coins");
      setCoins(res.data.coins);
    } catch (err) {
      console.log("Coins fetch error:", err);
    }
  };

  return (
    <CoinsContext.Provider value={{ coins, setCoins, refreshCoins }}>
      {children}
    </CoinsContext.Provider>
  );
}