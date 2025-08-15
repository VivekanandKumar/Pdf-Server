import axios from "axios";
import path from "node:path";
import AppError from "../Utils/AppError.js";
import PdfService from "../Utils/PdfService.js";
import fs from "node:fs";

const generatePdf = async (req, res, next) => {
  try {
    const { compress = false, upload = false, htmlFileUrl, orgID, appID, options = {} } = req.body;
    if (!htmlFileUrl) return next(new AppError("Html File url missing", 400));
    const HtmlContent = await getHtmlContent(htmlFileUrl);
    const service = new PdfService(HtmlContent, options);
    const generatedPdf = await service.Generate();
    if (compress) {
      const compressedPdf = await service.compress();
      if (upload) {
        const uploadedPdf = await service.upload(compressedPdf.filePath);
        return res.json(uploadedPdf);
      }
      return res.json(compressedPdf);
    }
    if (upload) {
      const uploadedPdf = await service.upload(generatedPdf.filePath);
      return res.json(uploadedPdf);
    }
    return res.json(generatedPdf);
  } catch (error) {
    console.error(error);
    return next(error.message, 500);
  }
};

const getPdf = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    const filePath = path.resolve("public", fileName);
    if (!fs.existsSync(filePath)) return next(new AppError("File not found", 404));
    const fileSize = fs.statSync(filePath).size;
    let downloaded = 0;
    const fileStream = fs.createReadStream(filePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    fileStream.on("data", (chunk) => {
      downloaded += chunk.length;
      const percentage = (downloaded / fileSize) * 100;
      showProgress(percentage);
    });
    fileStream.on("error", (err) => {
      console.error("❌ File stream error:", err);
      return next(new AppError("Error reading file", 500));
    });

    fileStream.on("close", () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      console.log("File Deleted from Storage.");
    });

    fileStream.pipe(res);
  } catch (err) {
    console.error("❌ Unexpected error in getPdf:", err);
    return next(new AppError("Internal Server Error", 500));
  }
};

async function getHtmlContent(url) {
  try {
    const response = await axios.get(url);
    if (response.status === 200) return response.data;
    else throw Error("Error in reading Html File");
  } catch (error) {
    return Promise.reject(error);
  }
}

function showProgress(percentage) {
  const barLength = 50; // total bar length in characters
  const filledLength = Math.round((percentage / 100) * barLength);
  const bar = "=".repeat(filledLength) + " ".repeat(barLength - filledLength);
  process.stdout.clearLine(); // clear current line
  process.stdout.cursorTo(0); // move cursor to start
  process.stdout.write(`Download Progress - [${bar}] ${percentage.toFixed(2)}%`);
  if (percentage >= 100) console.log("\n");
}

export { generatePdf, getPdf };
