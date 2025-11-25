import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.post("/create-qris", async (req, res) => {
  try {
    const { amount } = req.body;

    const result = await axios.post(
      "https://bigflip.id/api/v3/qris",
      {
        amount: amount,
        partner_tx_id: "trx_" + Date.now(),
        callback_url: "https://YOUR-RENDER-URL.onrender.com/webhook-qris"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLIP_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(result.data);
  } catch (err) {
    console.log(err.response?.data || err);
    res.status(500).json({ error: "failed" });
  }
});

app.post("/webhook-qris", (req, res) => {
  console.log("Webhook Flip:", req.body);
  res.send("OK");
});

app.listen(process.env.PORT, () => {
  console.log("Backend jalan di port", process.env.PORT);
});
