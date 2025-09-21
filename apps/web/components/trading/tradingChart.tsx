"use client";
import {
  createChart,
  AreaSeries,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "@/lib/config";

export default function TradingChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const [interval, setInterval] = useState<
    "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d"
  >("5m");
  const [symbol, setSymbol] = useState<string>("SOL_USDC");
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // First useEffect: Initialize the chart (runs once)
  useEffect(() => {
    if (!containerRef.current) return;

    // Create the chart
    const chart = createChart(containerRef.current, {
      layout: {
        textColor: "black",
        background: { type: "solid", color: "white" },
      },
    });

    // Add the area series
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#2962FF",
      topColor: "#2962FF",
      bottomColor: "rgba(41, 98, 255, 0.28)",
    });

    // Store references for later use
    chartRef.current = chart;
    seriesRef.current = areaSeries;

    // Handle resize
    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !chart) return;
      chart.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    });
    ro.observe(containerRef.current);

    // Initialize size once
    chart.applyOptions({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    chart.timeScale().applyOptions({
      timeVisible: true,
      secondsVisible: true,
    });

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // Only run once on mount

  // Second useEffect: Fetch data when interval or symbol changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const startTime = Math.floor(Date.now() / 1000) - 60 * 60 * 24;
        const response = await axios.get(
          `${API_URL}/chart/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}`
        );
        console.log("Fetched data:", response.data);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [interval, symbol]); // Run when interval or symbol changes

  // Third useEffect: Update chart data when data changes
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;
    seriesRef.current.setData(data);
    // Fit content after data update
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data]); // Run when data changes

  return (
    <div style={{ width: "100%", height: 700, position: "relative" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          Loading chart data...
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Optional: Add interval selector */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 5,
          display: "flex",
          gap: "8px",
        }}
      >
        {(["1m", "5m", "15m", "30m", "1h", "4h", "1d"] as const).map((int) => (
          <button
            key={int}
            onClick={() => setInterval(int)}
            style={{
              padding: "4px 8px",
              backgroundColor: interval === int ? "#2962FF" : "#f0f0f0",
              color: interval === int ? "white" : "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            {int}
          </button>
        ))}
      </div>
    </div>
  );
}
