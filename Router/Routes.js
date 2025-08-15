import express from "express";
import { generatePdf, getPdf } from "../Controllers/PdfControllers.js";
const Router = express.Router();

Router.post("/generate-pdf", generatePdf);
Router.get("/get-pdf/:fileName", getPdf);
export default Router;
