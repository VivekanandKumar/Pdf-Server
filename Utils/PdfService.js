import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs";
import { exec } from "node:child_process";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import S3Client from "../Utils/Client-S3.js";

const TIMEEOUT = 200000; // 200 seconds
const default_options = {
  format: "A4",
  landscape: false,
  margin: {
    bottom: "0.5cm",
    left: "0.5cm",
    top: "0.5cm",
    right: "0.5cm",
  },
  printBackground: true,
  timeout: TIMEEOUT,
};
const _args = ["--headless", "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-zygote", "--single-process"];

export default class PdfService {
  constructor(html = "", option = {}) {
    this.options = { ...default_options, ...option };
    this.html = html;
    this.originalFileName = `Original-${randomUUID()}.pdf`;
    this.compressedFileName = `Compressed-${randomUUID()}.pdf`;
    this.originalFilepath = path.resolve("public", this.originalFileName);
    this.compressedFilepath = path.resolve("public", this.compressedFileName);
    this.options.path = this.originalFilepath;
  }

  async Generate() {
    let browser;
    try {
      browser = await puppeteer.launch({
        args: _args,
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(this.html, {
        waitUntil: "networkidle0",
        timeout: TIMEEOUT,
      });

      await page.evaluateHandle("document.fonts.ready");

      await page.pdf(this.options);
      await browser.close();
      return {
        filePath: this.originalFilepath,
        fileName: this.originalFileName,
      };
    } catch (error) {
      if (browser) await browser.close();
      return Promise.reject(error);
    }
  }

  async compress() {
    try {
      const command = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/printer -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${this.compressedFilepath}" "${this.originalFilepath}"`;
      const result = await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) console.error(error);
          console.log(stdout);
          if (fs.existsSync(this.compressedFilepath)) {
            console.log("✅ File Compressed successfully.");
            console.log("Original File Stats : ", (fs.statSync(this.originalFilepath).size / 1024 / 1024).toFixed(2) + " MB");
            console.log("Compressed File Stats : ", (fs.statSync(this.compressedFilepath).size / 1024 / 1024).toFixed(2) + " MB");
            fs.unlinkSync(this.originalFilepath); // delete original file
            resolve({ fileName: this.compressedFileName, filePath: this.compressedFilepath });
          } else {
            // something went wrong in compressing file
            reject("something went wrong in compressing file");
          }
        });
      });
      return result;
    } catch (error) {
      console.log("❌ Error in compression returning Original Data - ", error.message);
      return { filePath: this.originalFilepath, fileName: this.originalFileName };
    }
  }

  async upload(filePath) {
    try {
      if (!fileName || !fs.existsSync(filePath)) throw Error("Invalid Filepath.");
      const fileStream = fs.createReadStream(filePath);
      const config = {
        Bucket: "*****",
        Key: path.basename(filePath),
        Body: fileStream,
        ContentLength: fs.statSync(filePath).size,
        ContentType: "application/pdf",
      };
      const command = new PutObjectCommand(config);
      const response = await S3Client.send(command);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return response;
    } catch (error) {
      console.error("Error in Pdf Upload to S3", error);
      return filePath;
    }
  }
}
