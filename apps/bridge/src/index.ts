import express from "express";

const app = express();
const PORT = process.env.PORT || 18181;

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Bridge server listening on port ${PORT}`);
});
