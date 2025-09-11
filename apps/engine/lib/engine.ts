export class EngineService {
  private balances: any;
  private openOrders: any;
  private assetPrices: any;

  constructor() {
    // Need to Import for DB SnapShot
    this.balances = new Map(); // Needs to be a MAP
    this.openOrders = new Map(); // Needs to be a MAP
    this.assetPrices = new Map();
  }

  async createOrGetUser(userEmail: string) {
    try {
      if (this.balances.has(userEmail)) {
        return {
          status: "success",
          balances: this.balances.get(userEmail),
          openOrders: this.openOrders.get(userEmail),
        };
      } else {
        // Need to add decimals
        const initialOnboardingBalance = 5000;
        const initialOpenOrders: any = [];

        this.balances.set(userEmail, initialOnboardingBalance);
        this.openOrders.set(userEmail, initialOpenOrders);

        return {
          status: "success",
          balances: this.balances.get(userEmail),
          openOrders: this.openOrders.get(userEmail),
        };
      }
    } catch (error) {
      console.log("Error:", error);
      return {
        status: "error",
        message: "Request Timeout",
      };
    }
  }

  async openBuyOrder(
    buyerEmail: string,
    assetSymbol: string,
    quantity: any,
    clientOrderId: string
  ): Promise<any> {
    try {
      // Check if user exist in balances
      if (this.balances.has(buyerEmail)) {
        let accountBalance = this.balances.get(buyerEmail);
        let pendingOrders = this.openOrders.get(buyerEmail);

        if (accountBalance >= this.assetPrices.get(assetSymbol) * quantity) {
          accountBalance -= this.assetPrices.get(assetSymbol) * quantity;

          pendingOrders.push({
            asset: assetSymbol,
            qty: quantity,
            orderId: clientOrderId,
          });

          this.balances.set(buyerEmail, accountBalance);
          this.openOrders.set(buyerEmail, pendingOrders);

          return {
            status: "success",
            orderId: clientOrderId,
            balances: accountBalance,
            openOrders: pendingOrders,
          };
        } else {
          return {
            status: "error",
            orderId: clientOrderId,
            balances: accountBalance,
            openOrders: pendingOrders,
          };
        }
      } else {
        const { status } = await this.createOrGetUser(buyerEmail);
        if (status == "success") {
          return this.openBuyOrder(buyerEmail, assetSymbol, quantity, clientOrderId);
        } else {
          throw new Error("Something went wrong in creating an user");
        }
      }
    } catch (error) {
        console.log("Error:", error);
        return {
          status: "error",
          message: "Request Timeout",
        };
    }
  }

  async closeOrder(
    userEmailToClose: string,
    orderIdToClose: string
  ): Promise<any> {
    try {
      if (
        this.balances.has(userEmailToClose) &&
        this.openOrders.has(userEmailToClose)
      ) {
        const userOpenOrdersList = this.openOrders.get(userEmailToClose);
        if (userOpenOrdersList == null) {
          return {
            status: "error",
            orderId: orderIdToClose,
            message: "order not found",
            balances: this.balances.get(userEmailToClose),
            openOrders: userOpenOrdersList,
          };
        }
        const orderIndex = userOpenOrdersList.findIndex(
          (order: any) => order.orderId === orderIdToClose
        );
        if (orderIndex === -1) {
          return {
            status: "error",
            orderId: orderIdToClose,
            message: "order not found",
            balances: this.balances.get(userEmailToClose),
            openOrders: userOpenOrdersList,
          };
        }

        const matchedOrder = userOpenOrdersList[orderIndex];
        const currentAssetPrice = this.assetPrices.get(matchedOrder.asset);
        const creditAmountToCredit = currentAssetPrice * matchedOrder.qty;

        const updatedBalanceAfterClose = this.balances.get(userEmailToClose) + creditAmountToCredit;
        this.balances.set(userEmailToClose, updatedBalanceAfterClose);

        userOpenOrdersList.splice(orderIndex, 1);
        this.openOrders.set(userEmailToClose, userOpenOrdersList);

        return {
          status: "success",
          orderId: orderIdToClose,
          balances: updatedBalanceAfterClose,
          openOrders: userOpenOrdersList,
        };
      }
    } catch (error) {
      console.log("Error:", error);
      return {
        status: "error",
        message: "Request Timeout",
      };
    }
  }

  updateAssetPrice(priceUpdates: any) {
    Object.keys(priceUpdates).forEach((assetSymbol) => {
      this.assetPrices.set(assetSymbol, priceUpdates[assetSymbol]);
    });
  }

  logEverything() {
    console.log(this.assetPrices);
    console.log(this.balances);
    console.log(this.openOrders);
  }

  async router(messages: any) {
    try {
      const parsedMessage = await JSON.parse(messages[0][1][1]);
      const { type, tripId } = parsedMessage;

      switch (type) {
        case "priceUpdate":
          const { type: _ignoredType, ...priceUpdates } = parsedMessage;
          this.updateAssetPrice(priceUpdates);
          break;

        case "createOrGetUser":
          const { email: userEmail } = parsedMessage;
          const addPayload = await this.createOrGetUser(userEmail);
          return { ...addPayload, tripId };

        case "openOrder":
          const { email: buyerEmail, asset: assetSymbol, qty: quantity, orderId: clientOrderId } = parsedMessage;
          const openOrderPayload = await this.openBuyOrder(
            buyerEmail,
            assetSymbol,
            quantity,
            clientOrderId
          );
          return { tripId, ...openOrderPayload };

        case "closeOrder":
          const { email: closingUserEmail, orderId: orderIdToClose } = parsedMessage;
          const closeOrderResponse = await this.closeOrder(
            closingUserEmail,
            orderIdToClose
          );

          return { ...closeOrderResponse, tripId };
        default:
          break;
      }
    } catch (error) {
      console.log("Error:", error);
      return {
        status: "error",
        message: "Request Timeout",
      };
    }
  }
}

export const engine = new EngineService();
