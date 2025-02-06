import  vision from "@google-cloud/vision";
import sharp from "sharp";
import {GoogleGenerativeAI } from "@google/generative-ai";

// Google Vision API Setup
const googleClient = new vision.ImageAnnotatorClient();

// Gemini AI Setup
const genAI = new GoogleGenerativeAI("GEMINI_API_KEY"); // TODO for me: Change to Gemini API Bethvour 
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Preprocess Image Using Sharp for Better OCR
async function preprocessImage(imagePath) {
  const processedPath = `${imagePath.split(".").slice(0, -1).join(".")}_processed.png`;

  try {
    await sharp(imagePath)
      .resize(1000) // Resize for better OCR accuracy
      .grayscale() // Convert to grayscale
      .normalise() // Normalize contrast
      .toFile(processedPath); // Save the processed image

    console.log("Image preprocessing complete:", processedPath);
    return processedPath;
  } catch (error) {
    console.error("Error during image preprocessing:", error);
    throw error;
  }
}

// Google Vision API for OCR
async function extractTextFromImage(imagePath) {
  try {
    const [result] = await googleClient.textDetection(imagePath);
    const detections = result.textAnnotations;
    if (detections && detections.length > 0) {
      return detections[0].description; // Return extracted text
    } else {
      throw new Error("No text detected in the image.");
    }
  } catch (error) {
    console.error("Error with Google Vision OCR:", error);
    throw error;
  }
}

// Gemini AI for Solving Math Problems
async function solveEquationWithGemini(equation) {
  try {
    const prompt = `Solve the following math problem and explain the steps: ${equation}`;
    const result = await model.generateContent(prompt);

    if (result && result.response && result.response.text()) {
      return result.response.text();
    }

    return "No detailed solution available.";
  } catch (error) {
    console.error("Error with Gemini AI:", error.response?.data || error.message);
    throw error;
  }
}

// Gemini AI for Checking Work
async function checkWorkWithGemini(studentWork, problem) {
  try {
    const prompt = `Check the following student work for the given math problem and provide annotations on any errors or areas for improvement:\n\nProblem: ${problem}\nStudent Work: ${studentWork}`;
    const result = await model.generateContent(prompt);

    if (result && result.response && result.response.text()) {
      return result.response.text();
    }

    return "No annotations available.";
  } catch (error) {
    console.error("Error with Gemini AI:", error.response?.data || error.message);
    throw error;
  }
}

// Clean and Validate Extracted Text
function validateAndCleanText(text) {
  const equationRegex = /[a-zA-Z0-9\+\-\*\/\=\s]+/g;
  const matches = text.match(equationRegex);
  if (matches) {
    return matches.join("").replace(/\s+/g, ""); // Remove extra spaces
  }
  return text;
}

// Main Function to Process Image and Solve/Check Equation
async function processImageQuestion(imagePath) {
  let finalAnswer;
  try {
    console.log(`Preprocessing the image...${imagePath}`);
    const processedImagePath = await preprocessImage(imagePath);

    console.log("Extracting text using Google Vision...");
    const extractedText = await extractTextFromImage(processedImagePath);

    if (extractedText.includes("QTAR")) {
      console.log("Detected 'QTAR': Solving the equation.");
      const equation = extractedText.replace("QTAR", "").trim();
      const cleanedEquation = validateAndCleanText(equation);
      console.log("Cleaned Equation:", cleanedEquation);

      console.log("Solving equation using Gemini AI...");
      const solution = await solveEquationWithGemini(cleanedEquation);

      console.log("\nFinal Solution:");
      console.log(solution);
      finalAnswer = { steps: solution };
    } else if (extractedText.includes("CTAR")) {
      console.log("Detected 'CTAR': Checking student work.");
      const parts = extractedText.split("CTAR");
      const problem = parts[0].trim();
      const studentWork = parts[1].trim();

      console.log("Checking work using Gemini AI...");
      const annotations = await checkWorkWithGemini(studentWork, problem);

      console.log("\nAnnotations:");
      console.log(annotations);
      finalAnswer = { steps: annotations };
    } else {
      console.log("No 'QTAR' or 'CTAR' detected in the image.");
      finalAnswer = { error: "No 'QTAR' or 'CTAR' detected in the image." };
    }
  } catch (error) {
    console.error("Error processing the image:", error);
    finalAnswer = { error: error.message || "Unknown error occurred" };
  }
  return finalAnswer;
}

export default processImageQuestion;
