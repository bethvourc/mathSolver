const axios = require("axios");
const vision = require("@google-cloud/vision");
const sharp = require("sharp");
const fs = require("fs");
const pdfkit = require("pdfkit");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Google Vision API Setup
const googleClient = new vision.ImageAnnotatorClient({
  keyFilename: "/Users/bethvour/projects/mathSolver/sanguine-willow-449120-c9-eda7b64969a5.json",
});

// Gemini AI Setup
const genAI = new GoogleGenerativeAI("AIzaSyCEYrxZEKAw-N9zi9UwzRHaswzXgJPB8cY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Preprocess Image
async function preprocessImage(imagePath) {
  const processedPath = `${imagePath.split(".").slice(0, -1).join(".")}_processed.png`;
  await sharp(imagePath).resize(1200).grayscale().sharpen().toFile(processedPath);
  return processedPath;
}

// Google Vision API for OCR
async function extractTextFromImage(imagePath) {
  const [result] = await googleClient.textDetection(imagePath);
  const detections = result.textAnnotations;
  if (detections && detections.length > 0) {
    return detections[0].description;
  } else {
    throw new Error("No text detected in the image.");
  }
}

// Solve the equation using Gemini AI
async function solveEquation(equation) {
  const prompt = `Solve the following math problem and provide step-by-step explanations:\n\n${equation}`;
  const result = await model.generateContent(prompt);
  return result?.response?.text() || "Solution unavailable.";
}

// Check student's work using Gemini AI
async function checkStudentWork(studentWork, problem) {
  const prompt = `The student attempted to solve this equation: ${problem}.
  Here is their work: ${studentWork}
  Analyze their solution and provide feedback on errors and how to fix them.`;
  
  const result = await model.generateContent(prompt);
  return result?.response?.text() || "No feedback available.";
}

// Generate PDF file for QTAR (Equation + Solution)
function generateSolutionPDF(equation, solution, outputPath) {
  const doc = new pdfkit();
  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(20).text("Math Equation Solution", { align: "center" });
  doc.moveDown();

  doc.fontSize(16).text("Step-by-Step Solution:");
  doc.fontSize(14).text(solution, { width: 500 });

  doc.end();
  console.log(`PDF created: ${outputPath}`);
}

// Generate PDF file for CTAR (Feedback on Mistakes)
function generateFeedbackPDF(problem, studentWork, feedback, outputPath) {
  const doc = new pdfkit();
  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(20).text("Math Work Evaluation", { align: "center" });
  doc.moveDown();

  doc.fontSize(16).text("Problem Given:");
  doc.fontSize(14).text(problem);
  doc.moveDown();

  doc.fontSize(16).text("Student's Work:");
  doc.fontSize(14).text(studentWork);
  doc.moveDown();

  doc.fontSize(16).text("Feedback & Corrections:");
  doc.fontSize(14).text(feedback);
  
  doc.end();
  console.log(`PDF created: ${outputPath}`);
}

// Main function
async function processImageQuestion(imagePath) {
  try {
    console.log("Preprocessing the image...");
    const processedImagePath = await preprocessImage(imagePath);

    console.log("Extracting text using Google Vision...");
    const extractedText = await extractTextFromImage(processedImagePath);

    if (extractedText.includes("QTAR")) {
      console.log("Detected 'QTAR': Solving the equation.");
      const equation = extractedText.replace("QTAR", "").trim();
      
      console.log("Solving equation using Gemini AI...");
      const solution = await solveEquation(equation);

      console.log("\nFinal Solution:");
      console.log(solution);

      const outputPDFPath = `${imagePath.split(".").slice(0, -1).join(".")}_solution.pdf`;
      generateSolutionPDF(equation, solution, outputPDFPath);
      
    } else if (extractedText.includes("CTAR")) {
      console.log("Detected 'CTAR': Checking student work.");
      const parts = extractedText.split("CTAR");
      const problem = parts[0].trim();
      const studentWork = parts[1].trim();

      console.log("Checking work using Gemini AI...");
      const feedback = await checkStudentWork(studentWork, problem);

      console.log("\nFeedback:");
      console.log(feedback);

      const outputPDFPath = `${imagePath.split(".").slice(0, -1).join(".")}_feedback.pdf`;
      generateFeedbackPDF(problem, studentWork, feedback, outputPDFPath);
      
    } else {
      console.log("No 'QTAR' or 'CTAR' detected in the image.");
    }
  } catch (error) {
    console.error("Error processing the image:", error);
  }
}

// Run the Program
processImageQuestion("/Users/bethvour/projects/mathSolver/images/img2.jpeg");