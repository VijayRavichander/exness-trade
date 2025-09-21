import TradingChart from "@/components/trading/tradingChart";

export default function Home() {
  return (
    <div className="text-3xl font-bold underline my-56">
      <h1 className="text-3xl font-bold underline my-10">Trading Chart</h1>
      <div className="flex flex-col gap-4 h-[800px]">
        <TradingChart />
      </div>
    </div>
  );
}