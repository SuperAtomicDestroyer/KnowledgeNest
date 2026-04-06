const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  uploadNote,
  getMyNotes,
  deleteNote,
  getNote,
  getPublicNotes,
  downloadNote,
  voteNote,
  getVoteCounts,
  getTrendingNotes,
  getRecommendedNotes,
  reportNote,
  getTopContributor,
} = require("../controllers/notesController");

router.post("/upload", protect, upload.single("file"), uploadNote);
router.get("/public", getPublicNotes);
router.get("/my-notes", protect, getMyNotes);
router.get("/download/:id", protect, downloadNote);
router.get("/trending", getTrendingNotes);
router.get("/recommended", protect, getRecommendedNotes);
router.post("/:id/vote", protect, voteNote);
router.get("/:id/votes", getVoteCounts);
router.delete("/:id", protect, deleteNote);
router.get("/:id", protect, getNote);
router.post("/:id", protect, reportNote);
router.get("/top-contributor", getTopContributor);
module.exports = router;
