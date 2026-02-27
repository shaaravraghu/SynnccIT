const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

// Run Python Code API (dummy)
app.post("/run/python", (req, res) => {
  const { code } = req.body;
  res.json({
    output: "Python execution API connected successfully",
    receivedCode: code
  });
});

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
