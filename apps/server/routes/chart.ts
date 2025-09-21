import express, { type Request, type Response } from "express";
import axios from "axios";

const chartRouter = express.Router();

chartRouter.get("/klines", async (req: Request, res: Response) => {
  try {
    const {
      symbol,
      interval = "1h",
      startTime = Math.floor(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      endTime = Math.floor(Date.now()),
    } = req.query;

    if (!symbol) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const response = await axios.get(
      `https://api.backpack.exchange/api/v1/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}`
    );

    const parsedData = response.data.map((item: any) => {
      return {
        value: parseFloat(item["close"]),
        time: Math.floor(new Date(item["end"]).getTime() / 1000),
      };
    });

    res.json(parsedData);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default chartRouter;
