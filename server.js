import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "daily-report-data.json");
const RESET_PASSWORD = process.env.RESET_PASSWORD || "";

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      lastResetAt: null
    };
  }

  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {
      lastResetAt: null
    };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

app.post("/api/daily-report/reset", (req, res) => {
  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({
      ok: false,
      message: "Password is required."
    });
  }

  if (password !== RESET_PASSWORD) {
    return res.status(401).json({
      ok: false,
      message: "Incorrect password."
    });
  }

  const data = readData();
  data.lastResetAt = new Date().toISOString();
  writeData(data);

  return res.json({
    ok: true,
    message: "Daily report reset successful."
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});