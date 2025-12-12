// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { exec } = require("child_process");
const { Types: MongooseTypes } = mongoose;

const app = express();
const PORT = 5000;

// === CONFIG ===
const NEWS_API_KEY =
  process.env.NEWS_API_KEY || "ac0743081bde48d190c03511b93ca94f";
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

// 🔹 Local LLM model for VisionIQ via Ollama
// Change this to "llama3.2" if you want to switch models.
const LOCAL_LLM_MODEL = "qwen2.5:3b";

// 🔹 STRONGER SYSTEM PROMPT (with Data Quality / strict numeric rules)
const buildVisionIQSystemPrompt = () => `
You are VisionIQ, an internal strategy research assistant for Zinnov.

Goals:
- Analyze markets, companies, deals, funding, technology, and strategy.
- Use ONLY the provided context (signals, datasets, notes) as the primary source of truth.
- Be concise, structured, and consultant-like.

Answer format:
1. "Insight Summary" (3–5 bullets).
2. "Supporting Evidence" (list of events or data points with references).
3. "Recommended Next Steps" (2–4 bullets).
4. If relevant: "Data Quality / Coverage Notes" (1–3 bullets about limitations of the dataset / signals).

STRICT RULES:
- You MUST ground every numeric statement (counts, ranges, headcounts, revenues, number of companies, years, etc.) in the context that is explicitly provided.
- Do NOT:
  - Invent or guess the number of companies, rows, or industries beyond what is explicitly stated.
  - Infer a specific industry focus (e.g., "automation only", "single industry") unless the context clearly says so.
  - Fabricate deal values, parties, industries, or dates that are not present in the context.
- If the context says, for example, "Distinct companies: 10", you MUST use that exact number rather than guessing from sample rows.
- If the context is small or clearly limited, say that explicitly under "Data Quality / Coverage Notes".

If there are NO relevant signals or data points for the query:
- Say so explicitly.
- You MAY answer using general knowledge, but clearly label that section as "General Market Knowledge (not from Zinnov Signals/Data)".
`;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// ----------------------------------------------------
// MULTER CONFIG - store all uploaded files on disk
// ----------------------------------------------------
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

// --- Employee Model ---
const EmployeeSchema = new mongoose.Schema({
  mail_id: { type: String, required: true },
  employee_id: { type: String, required: true },
});

// --- Strategy Signal Model ---
const SignalSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  severity: String,
  url: { type: String, index: true },
  publishedAt: { type: Date, index: true },
  source: String,
  company: String,
  industry: String,
  vertical: String,
  createdAt: { type: Date, default: Date.now },
});

// --- Dataset Model (metadata) ---
const DatasetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  size: { type: Number, required: true },
  filePath: { type: String },
  mimeType: { type: String },
  metadata: {
    tableName: { type: String, required: true },
    subPractice: { type: String, required: true },
    fileType: { type: String, required: true },
    description: { type: String },
    columns: [String],
    totalRows: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
});

// --- Dataset Data Rows ---
const DataRowSchema = new mongoose.Schema({
  dataset: { type: mongoose.Schema.Types.ObjectId, ref: "Dataset" },
  data: mongoose.Schema.Types.Mixed,
});
const DataRow = mongoose.model("DataRow", DataRowSchema);

const Dataset = mongoose.model("Dataset", DatasetSchema);
const Signal = mongoose.model("Signal", SignalSchema);
const Employee = mongoose.model("Employee", EmployeeSchema);

// --- MongoDB Connection ---
mongoose
  .connect("mongodb://localhost:27017/ZinnovPlatform")
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    // Seed allowed users automatically
    const users = [
      { mail_id: "vineet@zinnov.com", employee_id: "397" },
      { mail_id: "vishnu@draup.com", employee_id: "DBS0216" },
      { mail_id: "subramani.lokesh@zinnov.com", employee_id: "3267" },
      { mail_id: "chitra.s@zinnov.com", employee_id: "3292" },
      { mail_id: "dhinakaran.p@zinnov.com", employee_id: "2458" },
      { mail_id: "gopinath.d@zinnov.com", employee_id: "3294" },
      { mail_id: "hemamalini.v@zinnov.com", employee_id: "2459" },
      { mail_id: "janani.b@zinnov.com", employee_id: "3250" },
      { mail_id: "kiruthiga.a@zinnov.com", employee_id: "3295" },
      { mail_id: "kishore.mohandas@zinnov.com", employee_id: "2460" },
      { mail_id: "tamilselvan.s@zinnov.com", employee_id: "2383" },
      { mail_id: "akash.m@zinnov.com", employee_id: "contract_1" },
      { mail_id: "balachandru.s@zinnov.com", employee_id: "contract-2" },
      { mail_id: "ramya.n@zinnov.com", employee_id: "contract_3" },
      { mail_id: "sangeetha.n@zinnov.com", employee_id: "contract-4" },
      { mail_id: "shalini.k@zinnov.com", employee_id: "contract_5" },
      { mail_id: "srikanth.m@zinnov.com", employee_id: "contract_6" },
    ];

    Employee.deleteMany({})
      .then(() => Employee.insertMany(users))
      .then(() => console.log("✅ Users Seeded Successfully"))
      .catch((err) => console.log("❌ Seeding Error:", err));

    // Start auto-refresh for signals every 8 hours
    scheduleSignalsAutoRefresh();
  })
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// --- Test Route ---
app.get("/", (req, res) => {
  res.send("Backend is running and MongoDB connection checked!");
});

// --- Login API ---
app.post("/login", async (req, res) => {
  const { mail_id, employee_id } = req.body;

  try {
    const user = await Employee.findOne({ mail_id, employee_id });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user: { mail_id: user.mail_id } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ----------------------------------------------------
// STRATEGY SIGNALS – helpers
// ----------------------------------------------------
const detectCategory = (text) => {
  text = (text || "").toLowerCase();
  if (
    text.includes("acquire") ||
    text.includes("merger") ||
    text.includes("acquisition")
  )
    return { category: "M&A", severity: "High" };
  if (
    text.includes("funding") ||
    text.includes("investment") ||
    text.includes("series")
  )
    return { category: "Funding / Investments", severity: "Medium" };
  if (text.includes("partnership") || text.includes("alliance"))
    return { category: "Partnerships", severity: "Medium" };
  if (text.includes("layoff") || text.includes("restructure"))
    return { category: "Layoffs / Restructuring", severity: "High" };
  if (
    text.includes("ceo") ||
    text.includes("cto") ||
    text.includes("leadership")
  )
    return { category: "Leadership Movements", severity: "Medium" };
  if (text.includes("launch") || text.includes("product"))
    return { category: "Product Launches", severity: "Low" };
  if (
    text.includes("ai") ||
    text.includes("automation") ||
    text.includes("digital")
  )
    return {
      category: "Digital / AI / Automation Strategy Moves",
      severity: "Medium",
    };
  if (text.includes("expansion") || text.includes("new market"))
    return { category: "Market Expansion / New Market Entry", severity: "Low" };
  if (text.includes("ipo") || text.includes("valuation"))
    return { category: "IPO / Valuation Updates", severity: "High" };
  return { category: "General News", severity: "Low" };
};

const detectIndustryVertical = (text) => {
  const t = (text || "").toLowerCase();

  if (
    t.includes("tesla") ||
    t.includes("ev") ||
    t.includes("automotive") ||
    t.includes("bmw") ||
    t.includes("toyota")
  ) {
    return { industry: "Automotive", vertical: "Auto & Mobility" };
  }

  if (
    t.includes("bank") ||
    t.includes("fintech") ||
    t.includes("visa") ||
    t.includes("mastercard") ||
    t.includes("payment") ||
    t.includes("insurance")
  ) {
    return { industry: "Financial Services", vertical: "FinTech" };
  }

  if (
    t.includes("pharma") ||
    t.includes("biotech") ||
    t.includes("hospital") ||
    t.includes("healthcare") ||
    t.includes("vaccine")
  ) {
    return {
      industry: "Healthcare & Life Sciences",
      vertical: "HealthTech",
    };
  }

  if (
    t.includes("semiconductor") ||
    t.includes("chip") ||
    t.includes("nvidia") ||
    t.includes("intel") ||
    t.includes("amd")
  ) {
    return { industry: "Semiconductors", vertical: "Engineering R&D" };
  }

  if (
    t.includes("retail") ||
    t.includes("ecommerce") ||
    t.includes("amazon") ||
    t.includes("shopify")
  ) {
    return {
      industry: "Retail & Consumer",
      vertical: "Customer Experience",
    };
  }

  // Default
  return { industry: "Technology", vertical: "AI & Analytics" };
};

const extractCompany = (title, sourceName) => {
  if (!title && !sourceName) return null;
  if (sourceName) return sourceName;

  const tokens = (title || "").split(" ");
  if (tokens.length >= 2) return `${tokens[0]} ${tokens[1]}`;
  if (tokens.length === 1) return tokens[0];
  return sourceName || null;
};

const fetchAndStoreSignalsFromNews = async () => {
  const url = `https://newsapi.org/v2/everything?q=technology OR ai OR acquisition OR funding&language=en&sortBy=publishedAt&pageSize=100&apiKey=${NEWS_API_KEY}`;

  console.log("🌐 Fetching signals from NewsAPI...");
  const response = await axios.get(url);
  const articles = response.data.articles || [];

  if (!articles.length) {
    console.log("No articles received from NewsAPI.");
    return [];
  }

  const bulkOps = articles.map((a) => {
    const baseText = `${a.title || ""} ${a.description || ""}`;
    const cat = detectCategory(baseText);
    const meta = detectIndustryVertical(baseText);
    const company = extractCompany(a.title, a.source?.name);

    const doc = {
      title: a.title,
      description: a.description,
      category: cat.category,
      severity: cat.severity,
      url: a.url,
      publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
      source: a.source?.name,
      company,
      industry: meta.industry,
      vertical: meta.vertical,
    };

    return {
      updateOne: {
        filter: { url: a.url },
        update: { $set: doc },
        upsert: true,
      },
    };
  });

  if (bulkOps.length) {
    await Signal.bulkWrite(bulkOps);
    console.log(`✅ Upserted ${bulkOps.length} signals from NewsAPI`);
  }

  const allSignals = await Signal.find({})
    .sort({ publishedAt: -1 })
    .limit(1000);
  return allSignals;
};

const scheduleSignalsAutoRefresh = () => {
  fetchAndStoreSignalsFromNews().catch((err) =>
    console.error("Initial signals fetch failed:", err.message)
  );

  setInterval(() => {
    fetchAndStoreSignalsFromNews().catch((err) =>
      console.error("Scheduled signals fetch failed:", err.message)
    );
  }, EIGHT_HOURS_MS);
};

app.get("/api/fetch-signals", async (req, res) => {
  try {
    const signals = await fetchAndStoreSignalsFromNews();
    res.json({ success: true, signals });
  } catch (err) {
    console.error("Axios Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Error fetching news" });
  }
});

app.post("/api/signals/refresh", async (req, res) => {
  try {
    const signals = await fetchAndStoreSignalsFromNews();
    res.json({
      success: true,
      message: "Signals refreshed from NewsAPI.",
      signals,
    });
  } catch (err) {
    console.error("Manual refresh error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error refreshing signals" });
  }
});

app.post("/api/signals/visioniq-log", async (req, res) => {
  try {
    const { title } = req.body || {};
    console.log("📊 VisionIQ query logged for title:", title);
    res.json({ success: true });
  } catch (err) {
    console.error("VisionIQ-log error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error logging VisionIQ query" });
  }
});

app.post("/api/signals/company-focus", async (req, res) => {
  try {
    const { company, fromDate, toDate } = req.body;

    if (!company || !fromDate || !toDate) {
      return res
        .status(400)
        .json({ success: false, message: "company, fromDate, toDate are required" });
    }

    const fromISO = new Date(fromDate).toISOString().split("T")[0];
    const toISO = new Date(toDate).toISOString().split("T")[0];

    const query = encodeURIComponent(company);
    const url = `https://newsapi.org/v2/everything?q=${query}&from=${fromISO}&to=${toISO}&language=en&sortBy=publishedAt&pageSize=100&apiKey=${NEWS_API_KEY}`;

    console.log(`🌐 Company-focus fetch for ${company} from ${fromISO} to ${toISO}`);
    const response = await axios.get(url);
    const articles = response.data.articles || [];

    if (!articles.length) {
      return res.json({ success: true, signals: [] });
    }

    const bulkOps = articles.map((a) => {
      const baseText = `${a.title || ""} ${a.description || ""}`;
      const cat = detectCategory(baseText);
      const meta = detectIndustryVertical(baseText);

      const doc = {
        title: a.title,
        description: a.description,
        category: cat.category,
        severity: cat.severity,
        url: a.url,
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        source: a.source?.name,
        company: company,
        industry: meta.industry,
        vertical: meta.vertical,
      };

      return {
        updateOne: {
          filter: { url: a.url },
          update: { $set: doc },
          upsert: true,
        },
      };
    });

    await Signal.bulkWrite(bulkOps);

    const signals = await Signal.find({
      company: { $regex: company, $options: "i" },
      publishedAt: {
        $gte: new Date(fromDate),
        $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)),
      },
    }).sort({ publishedAt: -1 });

    res.json({ success: true, signals });
  } catch (err) {
    console.error("Company-focus error:", err.response?.data || err.message);
    res
      .status(500)
      .json({ success: false, message: "Error running company-focus search" });
  }
});

// GET /api/signals with filters
app.get("/api/signals", async (req, res) => {
  try {
    const {
      search,
      category,
      severity,
      fromDate,
      toDate,
      company,
      industry,
      vertical,
      limit,
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (industry) query.industry = industry;
    if (vertical) query.vertical = vertical;

    if (company) {
      query.company = { $regex: company, $options: "i" };
    }

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { source: regex },
        { company: regex },
        { category: regex },
      ];
    }

    if (fromDate || toDate) {
      query.publishedAt = {};
      if (fromDate) query.publishedAt.$gte = new Date(fromDate);
      if (toDate) {
        const dt = new Date(toDate);
        dt.setHours(23, 59, 59, 999);
        query.publishedAt.$lte = dt;
      }
    }

    const maxLimit = 5000;
    const parsedLimit = parseInt(limit || "1000", 10);
    const finalLimit = Math.min(parsedLimit, maxLimit);

    const signals = await Signal.find(query)
      .sort({ publishedAt: -1 })
      .limit(finalLimit);

    res.json({ success: true, signals });
  } catch (err) {
    console.error("Get signals error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error fetching signals" });
  }
});

// CSV export endpoint
app.get("/api/signals/export", async (req, res) => {
  try {
    const {
      search,
      category,
      severity,
      fromDate,
      toDate,
      company,
      industry,
      vertical,
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (industry) query.industry = industry;
    if (vertical) query.vertical = vertical;

    if (company) {
      query.company = { $regex: company, $options: "i" };
    }

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { source: regex },
        { company: regex },
        { category: regex },
      ];
    }

    if (fromDate || toDate) {
      query.publishedAt = {};
      if (fromDate) query.publishedAt.$gte = new Date(fromDate);
      if (toDate) {
        const dt = new Date(toDate);
        dt.setHours(23, 59, 59, 999);
        query.publishedAt.$lte = dt;
      }
    }

    const signals = await Signal.find(query).sort({ publishedAt: -1 });

    const headers = [
      "Title",
      "Description",
      "Category",
      "Severity",
      "Company",
      "Industry",
      "Vertical",
      "Source",
      "PublishedAt",
      "URL",
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const lines = [];
    lines.push(headers.join(","));

    for (const s of signals) {
      const row = [
        escapeCsv(s.title),
        escapeCsv(s.description),
        escapeCsv(s.category),
        escapeCsv(s.severity),
        escapeCsv(s.company),
        escapeCsv(s.industry),
        escapeCsv(s.vertical),
        escapeCsv(s.source),
        escapeCsv(s.publishedAt ? s.publishedAt.toISOString() : ""),
        escapeCsv(s.url),
      ];
      lines.push(row.join(","));
    }

    const csv = lines.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="zinnov_signals_export.csv"'
    );
    res.send(csv);
  } catch (err) {
    console.error("Export signals error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error exporting signals" });
  }
});

// ----------------------------------------------------
// EXCEL / CSV PARSERS
// ----------------------------------------------------

// Multi-sheet parser
const parseExcelFileMulti = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return [];
    }

    const sheets = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];

      const jsonWithHeaderRow = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
      });

      if (!jsonWithHeaderRow.length) {
        return {
          name: sheetName,
          columns: [],
          rows: [],
          totalRows: 0,
        };
      }

      const headerRow = jsonWithHeaderRow[0].map((h) =>
        h === null ? "" : String(h)
      );

      const rows = [];
      for (let i = 1; i < jsonWithHeaderRow.length; i++) {
        const rowArray = jsonWithHeaderRow[i];
        const rowObj = {};
        headerRow.forEach((colName, idx) => {
          if (colName) {
            rowObj[colName] =
              rowArray && rowArray[idx] !== undefined ? rowArray[idx] : null;
          }
        });
        const hasValue = Object.values(rowObj).some(
          (v) => v !== null && v !== ""
        );
        if (hasValue) rows.push(rowObj);
      }

      return {
        name: sheetName,
        columns: headerRow.filter((c) => c),
        rows,
        totalRows: rows.length,
      };
    });

    return sheets;
  } catch (e) {
    console.error("❌ parseExcelFileMulti error:", e.message);
    throw new Error("INVALID_EXCEL_FILE");
  }
};

// (Kept for backward compatibility but not used in new flows)
const parseExcelFile = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { columns: [], rows: [], totalRows: 0 };
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonWithHeaderRow = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });

    if (!jsonWithHeaderRow.length) {
      return { columns: [], rows: [], totalRows: 0 };
    }

    const headerRow = jsonWithHeaderRow[0].map((h) =>
      h === null ? "" : String(h)
    );

    const rows = [];
    for (let i = 1; i < jsonWithHeaderRow.length; i++) {
      const rowArray = jsonWithHeaderRow[i];
      const rowObj = {};
      headerRow.forEach((colName, idx) => {
        if (colName) {
          rowObj[colName] =
            rowArray && rowArray[idx] !== undefined ? rowArray[idx] : null;
        }
      });
      const hasValue = Object.values(rowObj).some(
        (v) => v !== null && v !== ""
      );
      if (hasValue) rows.push(rowObj);
    }

    return {
      columns: headerRow.filter((c) => c),
      rows,
      totalRows: rows.length,
    };
  } catch (e) {
    console.error("❌ parseExcelFile error:", e.message);
    throw new Error("INVALID_EXCEL_FILE");
  }
};

// ----------------------------------------------------
// PREVIEW BEFORE INGEST – Excel/CSV only (MULTI SHEET)
// ----------------------------------------------------
app.post("/api/datasets/preview", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .send("File too large. Please upload a file less than 500 MB.");
      }
      return res.status(400).send(err.message);
    } else if (err) {
      console.error("Upload error (preview):", err);
      return res.status(500).send("File upload failed.");
    }

    try {
      if (!req.file) {
        return res.status(400).send("File is required");
      }

      const ext = path.extname(req.file.originalname).toLowerCase();

      if ([".xlsx", ".xls", ".csv"].includes(ext)) {
        try {
          const sheets = parseExcelFileMulti(req.file.path);

          const previewSheets = sheets.map((s) => ({
            name: s.name,
            columns: s.columns,
            rows: s.rows.slice(0, 50),
            totalRows: s.totalRows,
          }));

          if (previewSheets.length === 1) {
            const s = previewSheets[0];
            fs.unlink(req.file.path, () => {});
            return res.json({
              columns: s.columns,
              rows: s.rows,
              totalRows: s.totalRows,
              sheets: previewSheets,
            });
          }

          fs.unlink(req.file.path, () => {});
          return res.json({
            sheets: previewSheets,
          });
        } catch (e) {
          fs.unlink(req.file.path, () => {});
          if (e.message === "INVALID_EXCEL_FILE") {
            return res
              .status(400)
              .send(
                "Invalid or corrupted Excel file. Please upload a valid .xlsx/.xls/.csv."
              );
          }
          throw e;
        }
      }

      fs.unlink(req.file.path, () => {});
      return res.json({
        columns: [],
        rows: [],
        totalRows: 0,
      });
    } catch (error) {
      console.error("Preview error:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, () => {});
      }
      res.status(500).send("Error while generating preview");
    }
  });
});

// ----------------------------------------------------
// INGEST – saves metadata, rows, and file (MULTI SHEET)
// ----------------------------------------------------
app.post("/api/datasets/ingest", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .send("File too large. Please upload a file less than 500 MB.");
      }
      return res.status(400).send(err.message);
    } else if (err) {
      console.error("Upload error (ingest):", err);
      return res.status(500).send("File upload failed.");
    }

    if (!req.file) {
      return res.status(400).send("File is required");
    }

    try {
      const {
        metadata: metadataStr,
        selectedColumns: selectedStr,
        selectedSheets: selectedSheetsStr,
        selectedColumnsPerSheet: selectedColumnsPerSheetStr,
      } = req.body;

      if (!metadataStr) {
        return res.status(400).send("Metadata is required");
      }

      const metadata = JSON.parse(metadataStr || "{}");
      const selectedColumns = selectedStr ? JSON.parse(selectedStr) : [];
      const selectedSheets = selectedSheetsStr
        ? JSON.parse(selectedSheetsStr)
        : null;
      const selectedColumnsPerSheet = selectedColumnsPerSheetStr
        ? JSON.parse(selectedColumnsPerSheetStr)
        : null;

      const ext = path.extname(req.file.originalname).toLowerCase();

      let finalColumns = [];
      let totalRows = 0;

      if ([".xlsx", ".xls", ".csv"].includes(ext)) {
        let sheets;
        try {
          sheets = parseExcelFileMulti(req.file.path);
        } catch (e) {
          if (e.message === "INVALID_EXCEL_FILE") {
            return res
              .status(400)
              .send(
                "Invalid or corrupted Excel file. Please upload a valid .xlsx/.xls/.csv."
              );
          }
          throw e;
        }

        const sheetNamesFromFile = sheets.map((s) => s.name);
        const sheetsToUse =
          selectedSheets && selectedSheets.length
            ? selectedSheets
            : sheetNamesFromFile;

        let allFilteredRows = [];
        const unionColumnsSet = new Set();

        for (const sheet of sheets) {
          if (!sheetsToUse.includes(sheet.name)) continue;

          let colsForThisSheet;

          if (selectedColumnsPerSheet && selectedColumnsPerSheet[sheet.name]) {
            colsForThisSheet = selectedColumnsPerSheet[sheet.name];
          } else if (selectedColumns && selectedColumns.length) {
            colsForThisSheet = selectedColumns;
          } else {
            colsForThisSheet = sheet.columns;
          }

          colsForThisSheet.forEach((c) => unionColumnsSet.add(c));

          const filteredRowsForSheet = sheet.rows.map((r) => {
            const obj = {};
            colsForThisSheet.forEach((c) => {
              obj[c] = r[c];
            });
            return obj;
          });

          allFilteredRows = allFilteredRows.concat(filteredRowsForSheet);
        }

        finalColumns = Array.from(unionColumnsSet);
        totalRows = allFilteredRows.length;

        const dataset = await Dataset.create({
          name: req.file.originalname,
          size: req.file.size,
          filePath: req.file.path,
          mimeType: req.file.mimetype,
          metadata: {
            tableName: metadata.tableName,
            subPractice: metadata.subPractice,
            fileType: metadata.fileType,
            description: metadata.description || "",
            columns: finalColumns,
            totalRows,
          },
        });

        const BATCH_SIZE = 5000;
        for (let i = 0; i < allFilteredRows.length; i += BATCH_SIZE) {
          const batch = allFilteredRows.slice(i, i + BATCH_SIZE).map((row) => ({
            dataset: dataset._id,
            data: row,
          }));
          await DataRow.insertMany(batch);
        }

        return res.json({ success: true, dataset });
      }

      const dataset = await Dataset.create({
        name: req.file.originalname,
        size: req.file.size,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        metadata: {
          tableName: metadata.tableName,
          subPractice: metadata.subPractice,
          fileType: metadata.fileType,
          description: metadata.description || "",
          columns: [],
          totalRows: 0,
        },
      });

      return res.json({ success: true, dataset });
    } catch (error) {
      console.error("Ingest error:", error);
      return res.status(500).send("Error while ingesting dataset");
    }
  });
});

// ----------------------------------------------------
// LIST datasets
// ----------------------------------------------------
app.get("/api/datasets", async (req, res) => {
  try {
    const datasets = await Dataset.find().sort({ createdAt: -1 });
    res.json({ success: true, datasets });
  } catch (err) {
    console.error("List datasets error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error listing datasets" });
  }
});

// ----------------------------------------------------
// DELETE dataset + rows + file from disk
// ----------------------------------------------------
app.delete("/api/datasets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dataset = await Dataset.findById(id);

    await DataRow.deleteMany({ dataset: id });
    await Dataset.findByIdAndDelete(id);

    if (dataset && dataset.filePath && fs.existsSync(dataset.filePath)) {
      fs.unlink(dataset.filePath, (err) => {
        if (err) console.error("Failed to delete file:", err);
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete dataset error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error deleting dataset" });
  }
});

// ----------------------------------------------------
// MIME MAP helper
// ----------------------------------------------------
const guessMimeType = (dataset) => {
  const ext = path.extname(dataset.name || "").toLowerCase();
  const fromDb = dataset.mimeType;
  const ftMeta = (dataset.metadata?.fileType || "").toLowerCase();

  if (ext === ".pdf" || ftMeta.includes("pdf")) {
    return "application/pdf";
  }
  if (ext === ".ppt") return "application/vnd.ms-powerpoint";
  if (ext === ".pptx")
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx")
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === ".xls") return "application/vnd.ms-excel";
  if (ext === ".xlsx")
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (ext === ".csv") return "text/csv";

  if (fromDb && fromDb !== "application/octet-stream") return fromDb;

  return "application/octet-stream";
};

// ----------------------------------------------------
// STREAM FILE
// ----------------------------------------------------
app.get("/api/files/:id/stream", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[STREAM] Requested dataset id:", id);

    if (!MongooseTypes.ObjectId.isValid(id)) {
      console.error("[STREAM] Invalid ObjectId:", id);
      return res.status(400).send("Invalid file id");
    }

    const dataset = await Dataset.findById(id);
    if (!dataset) {
      console.error("[STREAM] Dataset not found in DB for id:", id);
      return res.status(404).send("File not found");
    }

    if (!dataset.filePath) {
      console.error("[STREAM] Dataset has no filePath:", dataset);
      return res.status(404).send("File not found on server");
    }

    const absolutePath = path.isAbsolute(dataset.filePath)
      ? dataset.filePath
      : path.resolve(dataset.filePath);

    console.log("[STREAM] Resolved filePath:", absolutePath);

    if (!fs.existsSync(absolutePath)) {
      console.error("[STREAM] File does not exist on disk");
      return res.status(404).send("File not found on server");
    }

    const ext = path.extname(dataset.name || "").toLowerCase();

    if (ext === ".pdf") {
      console.log("[STREAM] PDF requested, streaming original file");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(dataset.name)}"`
      );
      res.setHeader("X-Content-Type-Options", "nosniff");

      const stream = fs.createReadStream(absolutePath);
      stream.on("error", (err) => {
        console.error("[STREAM] Read stream error (PDF):", err);
        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.end();
        }
      });
      return stream.pipe(res);
    }

    if (ext === ".ppt" || ext === ".pptx") {
      console.log(
        "[STREAM] PPT/PPTX requested, converting to PDF for preview..."
      );

      const previewDir = path.join(__dirname, "temp_previews");
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true });
      }

      const baseName = path.basename(absolutePath, ext);
      const pdfName = `${baseName}.pdf`;
      const pdfPath = path.join(previewDir, pdfName);

      const streamPdf = () => {
        console.log("[STREAM] Using converted PDF:", pdfPath);
        if (!fs.existsSync(pdfPath)) {
          console.error("[STREAM] Converted PDF not found on disk");
          return res.status(500).send("Preview conversion failed");
        }
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${encodeURIComponent(pdfName)}"`
        );
        res.setHeader("X-Content-Type-Options", "nosniff");
        const pdfStream = fs.createReadStream(pdfPath);
        pdfStream.on("error", (err) => {
          console.error("[STREAM] Read stream error (PDF converted):", err);
          if (!res.headersSent) {
            res.status(500).end();
          } else {
            res.end();
          }
        });
        pdfStream.pipe(res);
      };

      if (fs.existsSync(pdfPath)) {
        console.log("[STREAM] Reusing existing converted PDF");
        return streamPdf();
      }

      const cmd = `soffice --headless --convert-to pdf --outdir "${previewDir}" "${absolutePath}"`;
      console.log("[STREAM] Running LibreOffice command:", cmd);

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error("[STREAM] LibreOffice convert error:", error);
          console.error("[STREAM] LibreOffice stderr:", stderr);
          if (!res.headersSent) {
            return res
              .status(500)
              .send("Error converting PPTX to PDF for preview");
          }
          return res.end();
        }
        console.log("[STREAM] LibreOffice stdout:", stdout);
        streamPdf();
      });

      return;
    }

    const mime = guessMimeType(dataset);
    console.log("[STREAM] Using MIME type for other file:", mime);

    res.setHeader("Content-Type", mime);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(dataset.name)}"`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    const stream = fs.createReadStream(absolutePath);
    stream.on("error", (err) => {
      console.error("[STREAM] Read stream error (other types):", err);
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Stream file error:", error);
    if (!res.headersSent) {
      res.status(500).send("Error streaming file");
    } else {
      res.end();
    }
  }
});

// ----------------------------------------------------
// GET EXCEL ROWS (VIEW)  🔹 UPDATED for multi-sheet preview
// ----------------------------------------------------
app.get("/api/datasets/:id/rows", async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit || "100", 10);
    const skip = parseInt(req.query.skip || "0", 10);

    if (!MongooseTypes.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid dataset id" });
    }

    const dataset = await Dataset.findById(id);
    if (!dataset) {
      return res
        .status(404)
        .json({ success: false, message: "Dataset not found" });
    }

    const ext = path.extname(dataset.name || "").toLowerCase();

    if (
      dataset.filePath &&
      [".xlsx", ".xls", ".csv"].includes(ext) &&
      fs.existsSync(dataset.filePath)
    ) {
      try {
        const sheets = parseExcelFileMulti(dataset.filePath);

        const previewSheets = sheets.map((s) => ({
          name: s.name,
          columns: s.columns,
          rows: s.rows.slice(skip, skip + limit),
          totalRows: s.totalRows,
        }));

        if (previewSheets.length === 1) {
          const s = previewSheets[0];
          return res.json({
            success: true,
            columns: s.columns,
            rows: s.rows,
            totalRows: s.totalRows,
            sheets: previewSheets,
          });
        }

        return res.json({
          success: true,
          sheets: previewSheets,
        });
      } catch (e) {
        console.error("Multi-sheet preview error (GET /rows):", e.message);
      }
    }

    const columns = dataset.metadata?.columns || [];

    const rowsDocs = await DataRow.find({ dataset: id })
      .skip(skip)
      .limit(limit)
      .lean();

    const rows = rowsDocs.map((doc) => doc.data || {});

    res.json({
      success: true,
      columns,
      rows,
      totalRows: dataset.metadata?.totalRows || rows.length,
    });
  } catch (error) {
    console.error("Get rows error:", error);
    res.status(500).json({ success: false, message: "Error fetching rows" });
  }
});

// ----------------------------------------------------
// UPDATE EXCEL ROWS (EDIT)  🔹 UPDATED to accept multi-sheet payload
// ----------------------------------------------------
app.put("/api/datasets/:id/rows", async (req, res) => {
  try {
    const { id } = req.params;
    const { columns, rows, sheets } = req.body;

    if (!MongooseTypes.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid dataset id" });
    }

    const dataset = await Dataset.findById(id);
    if (!dataset) {
      return res
        .status(404)
        .json({ success: false, message: "Dataset not found" });
    }

    let finalColumns = [];
    let finalRowsArray = [];

    if (Array.isArray(sheets) && sheets.length > 0) {
      const colSet = new Set();

      sheets.forEach((sheet) => {
        const sheetRows = sheet.rows || [];
        sheetRows.forEach((r) => {
          Object.keys(r || {}).forEach((key) => colSet.add(key));
        });
        finalRowsArray = finalRowsArray.concat(sheetRows);
      });

      finalColumns = Array.from(colSet);
    } else {
      finalColumns = columns || dataset.metadata.columns || [];
      finalRowsArray = rows || [];
    }

    await DataRow.deleteMany({ dataset: id });

    const bulkRows = finalRowsArray.map((row) => ({
      dataset: id,
      data: row,
    }));

    const BATCH_SIZE = 5000;
    for (let i = 0; i < bulkRows.length; i += BATCH_SIZE) {
      const batch = bulkRows.slice(i, i + BATCH_SIZE);
      await DataRow.insertMany(batch);
    }

    dataset.metadata.columns = finalColumns;
    dataset.metadata.totalRows = finalRowsArray.length;
    await dataset.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Update rows error:", error);
    res.status(500).json({ success: false, message: "Error updating rows" });
  }
});

// ----------------------------------------------------
// VISIONIQ: build Signals context for the model (STRONG FILTERS)
// ----------------------------------------------------
const buildSignalsContext = async (filters = {}) => {
  const {
    category,
    industry,
    vertical,
    company,
    fromDate,
    toDate,
    limit = 30,
  } = filters;

  const query = {};

  if (category) query.category = category;
  if (industry) query.industry = industry;
  if (vertical) query.vertical = vertical;

  if (company) {
    query.company = { $regex: company, $options: "i" };
  }

  if (fromDate || toDate) {
    query.publishedAt = {};
    if (fromDate) query.publishedAt.$gte = new Date(fromDate);
    if (toDate) {
      const dt = new Date(toDate);
      dt.setHours(23, 59, 59, 999);
      query.publishedAt.$lte = dt;
    }
  }

  const signals = await Signal.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  if (!signals.length) {
    return "No matching signals found in the local Zinnov Signals DB for the given filters (category/industry/dates). If you answer, clearly state you are using general knowledge, not Zinnov signals.";
  }

  const lines = signals.map((s, idx) => {
    const dateStr = s.publishedAt
      ? new Date(s.publishedAt).toISOString().slice(0, 10)
      : "N/A";
    return `${idx + 1}. [${dateStr}] ${s.company || "Unknown company"} – ${
      s.title || ""
    } (Category: ${s.category || "N/A"}, Severity: ${
      s.severity || "N/A"
    }, Industry: ${s.industry || "N/A"}, Vertical: ${
      s.vertical || "N/A"
    })`;
  });

  return `Here are ${signals.length} matching signals from the Zinnov Signals DB (filtered by category/industry/dates if provided):\n` +
    lines.join("\n");
};

// ----------------------------------------------------
// VISIONIQ ANALYZE - Ollama backend (Signals-aware)
// ----------------------------------------------------
app.post("/api/visioniq/analyze", async (req, res) => {
  try {
    const { query, filters, context } = req.body || {};

    if (!query || typeof query !== "string") {
      return res.status(400).json({ ok: false, error: "Missing query text" });
    }

    const signalsContext = await buildSignalsContext(filters || {});

    const stitchedContext = `
USER QUESTION:
${query}

FILTERS:
${JSON.stringify(filters || {}, null, 2)}

ZINNOV SIGNALS CONTEXT:
${signalsContext}

ADDITIONAL CONTEXT:
${context || "No additional context passed."}
`;

    const ollamaRes = await axios.post(
      "http://localhost:11434/api/chat",
      {
        model: LOCAL_LLM_MODEL,
        messages: [
          { role: "system", content: buildVisionIQSystemPrompt() },
          { role: "user", content: stitchedContext },
        ],
        stream: false,
      },
      {
        timeout: 1000 * 180,
      }
    );

    const answer =
      ollamaRes.data?.message?.content ||
      ollamaRes.data?.choices?.[0]?.message?.content ||
      "";

    return res.json({ ok: true, answer });
  } catch (err) {
    console.error("VisionIQ /analyze error:", err.message || err);

    if (err.code === "ECONNABORTED") {
      return res.status(504).json({
        ok: false,
        error:
          "VisionIQ timed out waiting for the local model. Try again after warming up the model (run `ollama run qwen2.5:3b` once in a separate terminal).",
      });
    }

    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        ok: false,
        error:
          "Cannot reach Ollama at http://localhost:11434. Make sure 'ollama serve' is running and the model is pulled.",
      });
    }

    return res
      .status(500)
      .json({ ok: false, error: "VisionIQ internal error" });
  }
});

// ----------------------------------------------------
// TABULAR HELPERS FOR FILE SUMMARIZE
// ----------------------------------------------------
const describeColumnFromName = (colName = "") => {
  const c = colName.toLowerCase();
  if (!c) return "Generic column";

  if (c.includes("company")) return "Company name";
  if (c.includes("head") && c.includes("count"))
    return "Employee headcount (range or approximate)";
  if (c.includes("revenue")) return "Annual revenue (likely in USD)";
  if (c.includes("country") || c.includes("region"))
    return "Geography / region";
  if (c.includes("industry") || c.includes("sector"))
    return "Industry / sector classification";
  if (c.includes("vertical")) return "Vertical / sub-industry classification";
  if (c.includes("year") || c.includes("fy"))
    return "Year or financial year";
  if (c.includes("s.no") || c === "sno" || c === "id")
    return "Row identifier / serial number";

  return "Data attribute";
};

const buildTabularInsights = (sheet) => {
  const name = sheet.name || "Sheet";
  const columns = sheet.columns || [];
  const rows = sheet.rows || [];
  const totalRows = sheet.totalRows ?? rows.length;

  const columnSummaryLines = columns.map((c) => {
    return `- ${c} → ${describeColumnFromName(c)}`;
  });

  const SAMPLE_ROWS_COUNT = 5;
  const sampleRows = rows.slice(0, SAMPLE_ROWS_COUNT);

  const headCountCol = columns.find(
    (c) =>
      c.toLowerCase().includes("head") && c.toLowerCase().includes("count")
  );
  const revenueCol = columns.find((c) =>
    c.toLowerCase().includes("revenue")
  );
  const companyCol = columns.find((c) =>
    c.toLowerCase().includes("company")
  );

  let headCountsNum = [];
  let revenuesText = [];
  let companies = [];

  if (headCountCol) {
    headCountsNum = rows
      .map((r) => {
        const raw = r[headCountCol];
        if (raw == null) return null;
        const cleaned = String(raw).replace(/[^0-9]/g, "");
        const n = cleaned ? parseInt(cleaned, 10) : null;
        return Number.isFinite(n) ? n : null;
      })
      .filter((v) => v !== null);
  }

  if (revenueCol) {
    revenuesText = rows
      .map((r) => r[revenueCol])
      .filter((v) => v !== null && v !== undefined)
      .map((v) => String(v).trim());
  }

  if (companyCol) {
    companies = rows
      .map((r) => r[companyCol])
      .filter((v) => v !== null && v !== undefined)
      .map((v) => String(v).trim());
  }

  const uniqueCompanies = new Set(companies);
  const uniqueRevenues = new Set(revenuesText);

  const aggLines = [];
  aggLines.push(`- Total rows (in this sheet): ${totalRows}`);
  if (companyCol) {
    aggLines.push(`- Distinct companies: ${uniqueCompanies.size}`);
    if (uniqueCompanies.size <= 30) {
      aggLines.push(
        `- Companies (exact list): ${Array.from(uniqueCompanies).join(", ")}`
      );
    }
  }
  if (headCountsNum.length) {
    const minHC = Math.min(...headCountsNum);
    const maxHC = Math.max(...headCountsNum);
    aggLines.push(
      `- Headcount numeric range (approx, ignoring symbols): ${minHC} – ${maxHC}`
    );
  }
  if (revenuesText.length) {
    aggLines.push(
      `- Distinct revenue values: ${Array.from(uniqueRevenues).join(", ")}`
    );
    aggLines.push(
      `- Revenue uniformity: ${
        uniqueRevenues.size === 1
          ? "All rows show the SAME revenue value"
          : "Multiple different revenue values present"
      }`
    );
  }

  const sampleRowLines = sampleRows.map((r, idx) => {
    return `${idx + 1}. ${JSON.stringify(r)}`;
  });

  return `
SHEET: ${name}

COLUMNS SUMMARY:
${columnSummaryLines.join("\n")}

AGGREGATED FACTS (USE EXACT VALUES, DO NOT GUESS BEYOND THEM):
${aggLines.join("\n")}

SAMPLE ROWS (up to ${SAMPLE_ROWS_COUNT}):
${sampleRowLines.join("\n")}
`;
};

// ----------------------------------------------------
// VISIONIQ FILE SUMMARIZE - analyze a specific dataset file (tabular aware)
// ----------------------------------------------------
const buildFileContextForVision = (dataset, sheetsOrText) => {
  const meta = dataset.metadata || {};
  const headerBlock = `
DATASET METADATA:
- File Name: ${dataset.name}
- Table Name: ${meta.tableName || "-"}
- Sub-Practice: ${meta.subPractice || "-"}
- File Type: ${meta.fileType || "-"}
- Description: ${meta.description || "-"}
- Total Rows (approx, from ingest): ${meta.totalRows ?? "-"}
`;

  if (Array.isArray(sheetsOrText)) {
    const MAX_SHEETS = 3;
    const limitedSheets = sheetsOrText.slice(0, MAX_SHEETS);

    const sheetBlocks = limitedSheets.map((sheet) =>
      buildTabularInsights({
        name: sheet.name,
        columns: sheet.columns || [],
        rows: sheet.rows || [],
        totalRows: sheet.totalRows,
      })
    );

    return `${headerBlock}

FILE CONTENT (TABULAR INSIGHTS - USE THESE EXACT COUNTS, DO NOT GUESS BEYOND THEM):
${sheetBlocks.join("\n-------------------------\n")}
`;
  }

  const MAX_CHARS = 8000;
  const textSnippet =
    typeof sheetsOrText === "string" ? sheetsOrText.slice(0, MAX_CHARS) : "";

  return `${headerBlock}

FILE RAW TEXT SNIPPET (may be partial or noisy for binary formats):
${textSnippet}
`;
};

app.post("/api/visioniq/summarize-file", async (req, res) => {
  try {
    const { datasetId, question } = req.body || {};

    if (!datasetId) {
      return res
        .status(400)
        .json({ ok: false, error: "datasetId is required" });
    }

    if (!MongooseTypes.ObjectId.isValid(datasetId)) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid datasetId ObjectId" });
    }

    const dataset = await Dataset.findById(datasetId);
    if (!dataset) {
      return res.status(404).json({ ok: false, error: "Dataset not found" });
    }

    const filePath = dataset.filePath;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        ok: false,
        error: "Dataset file not found on disk for summarization",
      });
    }

    const ext = path.extname(dataset.name || "").toLowerCase();
    let fileContextPayload;

    if ([".xlsx", ".xls", ".csv"].includes(ext)) {
      try {
        const sheets = parseExcelFileMulti(filePath);

        const MAX_ROWS_PER_SHEET = 50;
        const trimmedSheets = sheets.map((s) => ({
          name: s.name,
          columns: s.columns || [],
          rows: (s.rows || []).slice(0, MAX_ROWS_PER_SHEET),
          totalRows: s.totalRows,
        }));

        fileContextPayload = trimmedSheets;
      } catch (e) {
        console.error("VisionIQ summarize - excel parse error:", e);
        fileContextPayload =
          "Excel/CSV file, but parsing failed. Only metadata will be used.";
      }
    } else {
      try {
        let content;
        try {
          content = fs.readFileSync(filePath, "utf8");
        } catch {
          const buf = fs.readFileSync(filePath);
          content = buf.toString("utf8");
        }
        fileContextPayload = content;
      } catch (e) {
        console.error("VisionIQ summarize - file read error:", e);
        fileContextPayload =
          "Binary / unsupported format. Text extraction not implemented; only metadata is available.";
      }
    }

    const contextForModel = buildFileContextForVision(
      dataset,
      fileContextPayload
    );

    const userQuestion =
      question ||
      "Summarize this file. Provide: (1) Insight Summary (2) Supporting Evidence (3) Recommended Next Steps (4) Data Quality / Coverage Notes.";

    const stitchedPrompt = `
You are VisionIQ, summarizing a single knowledge asset file for internal use.

USER TASK:
${userQuestion}

FILE CONTEXT (TABULAR INSIGHTS + METADATA):
${contextForModel}
`;

    const ollamaRes = await axios.post(
      "http://localhost:11434/api/chat",
      {
        model: LOCAL_LLM_MODEL,
        messages: [
          { role: "system", content: buildVisionIQSystemPrompt() },
          { role: "user", content: stitchedPrompt },
        ],
        stream: false,
      },
      {
        timeout: 0,
      }
    );

    const answer =
      ollamaRes.data?.message?.content ||
      ollamaRes.data?.choices?.[0]?.message?.content ||
      "";

    return res.json({ ok: true, answer });
  } catch (err) {
    console.error("VisionIQ /summarize-file error:", err.message || err);

    if (err.code === "ECONNABORTED") {
      return res.status(504).json({
        ok: false,
        error:
          "VisionIQ request to Ollama timed out. Try warming the model with `ollama run qwen2.5:3b` and/or summarizing a smaller file.",
      });
    }

    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        ok: false,
        error:
          "Cannot reach Ollama at http://localhost:11434. Ensure `ollama serve` is running and qwen2.5:3b is pulled.",
      });
    }

    return res
      .status(500)
      .json({ ok: false, error: "VisionIQ summarize-file internal error" });
  }
});


// ----------------------------------------------------
// VISIONIQ – COMPANY PROFILE (signals-first + structured JSON)
// ----------------------------------------------------

// Helper: build company-specific signals context WITH count
const buildCompanySignalsContext = async ({
  company,
  industry,
  vertical,
  fromDate,
  toDate,
  limit = 40,
}) => {
  const query = {};

  if (company) {
    query.company = { $regex: company, $options: "i" };
  }
  if (industry) {
    query.industry = industry;
  }
  if (vertical) {
    query.vertical = vertical;
  }
  if (fromDate || toDate) {
    query.publishedAt = {};
    if (fromDate) query.publishedAt.$gte = new Date(fromDate);
    if (toDate) {
      const dt = new Date(toDate);
      dt.setHours(23, 59, 59, 999);
      query.publishedAt.$lte = dt;
    }
  }

  const signals = await Signal.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  if (!signals.length) {
    return {
      count: 0,
      text:
        "No matching signals found in the local Zinnov Signals DB for this company and filters. " +
        "You MUST clearly state that a signals-based company profile cannot be generated for this slice.",
    };
  }

  const lines = signals.map((s, idx) => {
    const dateStr = s.publishedAt
      ? new Date(s.publishedAt).toISOString().slice(0, 10)
      : "N/A";
    return `${idx + 1}. [${dateStr}] ${s.company || "Unknown company"} – ${
      s.title || ""
    } (Category: ${s.category || "N/A"}, Severity: ${
      s.severity || "N/A"
    }, Industry: ${s.industry || "N/A"}, Vertical: ${
      s.vertical || "N/A"
    })`;
  });

  return {
    count: signals.length,
    text:
      `Here are ${signals.length} signals for this company from the Zinnov Signals DB:\n` +
      lines.join("\n"),
  };
};

app.post("/api/visioniq/company-profile", async (req, res) => {
  try {
    const {
      company,
      fromDate,
      toDate,
      industry,
      vertical,
      extraContext,
      // default true so we can fill structured details from general knowledge
      allowGeneralKnowledge = true,
    } = req.body || {};

    if (!company || !company.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Company name is required" });
    }

    const trimmedCompany = company.trim();

    // 1) Build signals context for the company
    const { count: signalsCount, text: signalsContext } =
      await buildCompanySignalsContext({
        company: trimmedCompany,
        industry,
        vertical,
        fromDate,
        toDate,
      });

    // 2) VERY strict task prompt + structured JSON requirement
    const userTask = `
You are VisionIQ, generating a **consulting-style company profile** for internal Zinnov use.

TARGET COMPANY: ${trimmedCompany}
OPTIONAL FILTERS:
- Industry: ${industry || "-"}
- Vertical: ${vertical || "-"}
- From Date: ${fromDate || "-"}
- To Date: ${toDate || "-"}

ALLOW_GENERAL_KNOWLEDGE: ${allowGeneralKnowledge ? "YES" : "NO"}
SIGNALS_COUNT: ${signalsCount}

HARD RULES:

1) PRIMARY EVIDENCE = ZINNOV SIGNALS
   - Use the ZINNOV SIGNALS CONTEXT as the primary factual source.
   - If something is NOT mentioned in signals, do not claim it is signals-based.

2) WHEN SIGNALS_COUNT = 0:
   - You MUST clearly say that a signals-based profile cannot be generated.
   - If ALLOW_GENERAL_KNOWLEDGE is "NO":
       * Only produce a short explanation that there are no signals.
       * DO NOT describe the company from general knowledge.
   - If ALLOW_GENERAL_KNOWLEDGE is "YES":
       * You may add a descriptive section based on general market knowledge,
         but it MUST be clearly marked:
         "General Market Knowledge (not from Zinnov Signals)".

3) WHEN SIGNALS_COUNT > 0:
   - Sections 1–5 below MUST be based ONLY on signals.
   - If something is not visible in signals, say:
     "Not visible in current Zinnov Signals slice."
   - General knowledge, if allowed, goes ONLY in the final extra section and
     must be clearly labeled as not signals-based.

4) OUTPUT FORMAT – MARKDOWN PROFILE:

### Company Profile for ${trimmedCompany}

#### 1. Signals-based Company Overview
- Brief overview derived ONLY from signals (or say none available).

#### 2. Strategic & Corporate Moves (from Signals)
- Bullet points for M&A, partnerships, launches, funding, etc.

#### 3. AI / Automation / Digital Strategy (from Signals)
- Signals-based view of AI/digital/automation strategy.

#### 4. Risk Factors / Watchpoints (from Signals)
- Layoffs, restructuring, regulatory risks, etc. from signals.

#### 5. Recommended Next Steps for a Zinnov Consultant
- 3–5 concrete, signals-aware next steps.

IF YOU USE GENERAL KNOWLEDGE (AND ALLOWED):
- Add at the end:
### General Market Knowledge (not from Zinnov Signals)
- Describe the company, its products, services, etc., from general knowledge.

5) STRUCTURED JSON SUMMARY (MANDATORY)

After the markdown profile, output a SINGLE LINE starting with:
===STRUCTURED===

Followed IMMEDIATELY by a valid JSON object (no markdown, no backticks).
Example:

===STRUCTURED=== {"companyName":"...", "website":"..."}

The JSON MUST include these fields (use null or [] if unknown):

{
  "companyName": string,
  "website": string | null,
  "companyLinkedin": string | null,
  "headquarters": string | null,
  "foundedYear": number | null,
  "totalHeadcountApprox": string | null,
  "industryVerticals": string[],          // e.g. ["Search & Ads", "Cloud", "Consumer Internet"]
  "products": string[],                   // product names only
  "services": string[],                   // service categories only
  "leadership": [                         // key leaders, 0–5 entries
    {
      "name": string,
      "role": string,
      "linkedin": string | null
    }
  ],
  "latestRevenue": {
    "year": number | null,
    "value": string | null,              // e.g. "307 Bn"
    "currency": string | null,           // e.g. "USD"
    "note": string | null                // e.g. "approximate, public filings"
  },
  "last3YearsRevenue": [
    {
      "year": number | null,
      "value": string | null,
      "currency": string | null,
      "note": string | null
    }
  ]
}

IMPORTANT:
- If ALLOW_GENERAL_KNOWLEDGE is "NO", the JSON should only reflect what is
  actually in signals or be null/empty.
- If ALLOW_GENERAL_KNOWLEDGE is "YES", you may fill JSON based on general
  market knowledge, BUT you must be reasonably accurate and NEVER claim it is
  from Zinnov Signals.
- JSON MUST be parseable. No comments, no trailing commas.

Do NOT put the JSON inside a markdown code block.
    `;

    const stitchedContext = `
ZINNOV SIGNALS CONTEXT (for ${trimmedCompany}):
${signalsContext}

EXTRA USER CONTEXT (if any):
${extraContext || "None"}
    `;

    const ollamaRes = await axios.post(
      "http://localhost:11434/api/chat",
      {
        model: LOCAL_LLM_MODEL,
        messages: [
          { role: "system", content: buildVisionIQSystemPrompt() },
          { role: "user", content: userTask },
          { role: "user", content: stitchedContext },
        ],
        stream: false,
      },
      {
        timeout: 0, // let Ollama take as long as needed
      }
    );

    const raw =
      ollamaRes.data?.message?.content ||
      ollamaRes.data?.choices?.[0]?.message?.content ||
      "";

    // 3) Split out markdown vs structured JSON
    let profileMarkdown = raw;
    let structured = null;

    const marker = "===STRUCTURED===";
    const idx = raw.indexOf(marker);
    if (idx !== -1) {
      profileMarkdown = raw.substring(0, idx).trim();
      const jsonPart = raw.substring(idx + marker.length).trim();

      try {
        structured = JSON.parse(jsonPart);
      } catch (e) {
        console.error("Failed to parse structured JSON from company-profile:", e.message);
      }
    }

    return res.json({
      ok: true,
      profile: profileMarkdown,
      structured,
      signalsCount,
    });
  } catch (err) {
    console.error("VisionIQ /company-profile error:", err.message || err);

    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        ok: false,
        error:
          "Cannot reach Ollama at http://localhost:11434. Make sure 'ollama serve' is running and the model is pulled.",
      });
    }

    if (err.code === "ECONNABORTED") {
      return res.status(504).json({
        ok: false,
        error:
          "VisionIQ company profile request timed out. Try again after warming up the model.",
      });
    }

    return res.status(500).json({
      ok: false,
      error: "VisionIQ company profile internal error",
    });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
