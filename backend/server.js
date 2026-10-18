import dotenv from "dotenv";
import { passwordPolicyError } from "./utils/authSecurity.js";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Configure it in backend/.env.");
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}

const [
  { default: express },
  { default: cors },
  { prisma },
  authMiddleware,
  authRoutes,
  propertyRoutes,
  userRoutes,
  adminRoutes,
  contactRoutes,
  uploads,
] = await Promise.all([
  import("express"),
  import("cors"),
  import("./db.js"),
  import("./middleware/auth.js"),
  import("./routes/auth.routes.js"),
  import("./routes/property.routes.js"),
  import("./routes/user.routes.js"),
  import("./routes/admin.routes.js"),
  import("./routes/contact.routes.js"),
  import("./middleware/uploads.js"),
]);

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("This origin is not allowed by CORS."));
      }
    },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/uploads", express.static(uploads.uploadRoot, { maxAge: "1d" }));
app.use("/api", authMiddleware.optionalAuth);
app.use("/api/auth", authRoutes.default);
app.use("/api/properties", propertyRoutes.default);
app.use("/api/users", userRoutes.default);
app.use(
  "/api/admin",
  authMiddleware.requireAuth,
  authMiddleware.requireRole("admin"),
  adminRoutes.default,
);
app.use("/api/contact", contactRoutes.default);

app.get("/health", async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ok", database: "connected" });
});

app.get("/", (req, res) => {
  res.send("Real Estate API is running.");
});

app.use((req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ message: "Request body must contain valid JSON." });
  }
  if (error.message === "This origin is not allowed by CORS.") {
    return res.status(403).json({ message: error.message });
  }
  if (error.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ message: "Images must be no larger than 5 MB each." });
  }
  if (
    error.code === "LIMIT_FILE_COUNT" ||
    error.code === "LIMIT_UNEXPECTED_FILE"
  ) {
    return res
      .status(400)
      .json({ message: "Upload no more than 10 property images." });
  }
  if (error.code === "22P02") {
    return res
      .status(400)
      .json({ message: "The supplied ID or value has an invalid format." });
  }
  if (error.code === "P2023" || error.code === "P2007") {
    return res
      .status(400)
      .json({ message: "The supplied ID or value has an invalid format." });
  }
  if (error.message?.startsWith("Only JPEG")) {
    return res.status(400).json({ message: error.message });
  }
  console.error("API request failed:", error);
  return res
    .status(500)
    .json({ message: "An unexpected server error occurred." });
});

async function provisionAdmin() {
  const email = String(process.env.ADMIN_EMAIL || "")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email && !password) {
    console.warn(
      "No initial admin configured. Set ADMIN_EMAIL and ADMIN_PASSWORD to provision one.",
    );
    return;
  }
  if (!email || !password) {
    throw new Error(
      "Set both ADMIN_EMAIL and ADMIN_PASSWORD to provision the initial admin.",
    );
  }
  const passwordError = passwordPolicyError(password);
  if (passwordError) {
    throw new Error(`ADMIN_PASSWORD is invalid. ${passwordError}`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }

  const { default: bcrypt } = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {
      name: process.env.ADMIN_NAME?.trim() || "Administrator",
      passwordHash,
      role: "admin",
      status: "active",
      emailVerified: true,
      tokenVersion: { increment: 1 },
    },
    create: {
      name: process.env.ADMIN_NAME?.trim() || "Administrator",
      email,
      passwordHash,
      role: "admin",
      emailVerified: true,
    },
  });
  console.log(`Initial admin account provisioned for ${email}.`);
}

await provisionAdmin();

const port = Number(process.env.PORT || 5000);
const server = await new Promise((resolve, reject) => {
  const listeningServer = app.listen(port, () => resolve(listeningServer));
  listeningServer.once("error", reject);
});
console.log(`Real Estate API listening on http://localhost:${port}`);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    server.close(async (error) => {
      if (error) console.error("Error closing HTTP server:", error);
      await prisma.$disconnect();
      process.exit(error ? 1 : 0);
    });
  });
}
