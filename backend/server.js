const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("KNest Backend Running");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/notes", require("./routes/notesRoutes"));

app.use(require("./middleware/errorMiddleware"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
