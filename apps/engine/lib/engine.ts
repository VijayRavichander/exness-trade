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


  async updateBalances() {}

  async updateOpenOrders() {}

  async addUser(userEmail: string) {
    if (this.balances.has(userEmail)) {
      return {
        balances: this.balances.get(userEmail),
        openOrders: this.openOrders.get(userEmail),
      };
    } else {
      const newUserOnBoardingAmount = 5000 * 100; // 5000 USD * 100 (2 DECIMALS)
      const newWallet = {
        SOL_USDC: {
          unit: 0,
        },
        BTC_USDC: {
          unit: 0,
        },
        ETC_USDC: {
          unit: 0,
        },
      };

      this.balances.set(userEmail, newUserOnBoardingAmount);
      this.openOrders.set(userEmail, newWallet);

      return {
        balances: this.balances.get(userEmail),
        openOrders: this.openOrders.get(userEmail),
      };
    }
  }

  updateAssetPrice(prices: any) {
    Object.keys(prices).forEach(key => {
      this.assetPrices.set(key, prices[key]);
    });
  }

  logEverything (){
    console.log(this.assetPrices);
    console.log(this.balances);
    console.log(this.openOrders);
  }


  async router(messages: any) {
    const parse_data = await JSON.parse(messages[0][1][1]);
    const { type, tripId } = parse_data;

    switch (type) {
      case "addUser":
        const { email: userEmail } = parse_data;
        const payload = await this.addUser(userEmail);
        return { ...payload, tripId };
      
      case "priceUpdate":
        const {type, ...prices} = parse_data;
        this.updateAssetPrice(prices)
        break;

      case "placeOrder":
        const { email: orderEmail, order } = parse_data;
        return { email: orderEmail, order };

      default:
        break;
    }
  }
}

export const engine = new EngineService();
