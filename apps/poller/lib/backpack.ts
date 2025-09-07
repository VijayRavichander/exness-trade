import WebSocket from "ws";
import { API, SUBSCRIPTIONS } from "./constants";
import { lastestPrices } from "./store";
import type { Symbol } from "./constants";

export function getBackPackEvents(wallets: Symbol[]) {
  const WS = new WebSocket(API);

  WS.on("open", () => {
    console.log("[BACKPACK EXCHANGE INIT] Connecting to Backpack Exchange");

    wallets.forEach((wallet) => {
      SUBSCRIPTIONS.forEach((subscription) => {
        WS.send(
          JSON.stringify({
            method: "SUBSCRIBE",
            params: [`${subscription}.${wallet}`],
          })
        );
      });
    });
  });

  WS.on("message", (message: any) => {
    try {
      const ticker_info = JSON.parse(message.toString());
      const data = ticker_info.data

      // BookTicker get's latest Selling / Asking Price
      if (data.e === "bookTicker") {
        const symbol = data.s as Symbol;
        const price = data.a;
        lastestPrices[symbol] = price;
      }
    } catch (err) {
      console.error("Error on WS Message", err);
    }
  });

  WS.on("error", (err: any) => {
    console.log(`Something went wrong. ${err}`);
  });

  WS.on("close", (code: any, reason: any) => {
    console.log("[BACKPACK EXCHANGE CLOSED] Connection closed", code, reason);
  });
}
