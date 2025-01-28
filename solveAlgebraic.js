const axios = require("axios");
const vision = require("@google-cloud/vision");
const sharp = require("sharp");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Google Vision API Setup
const googleClient = new vision.ImageAnnotatorClient({
  keyFilename: "", 
});

// Gemini AI Setup
const genAI = new GoogleGenerativeAI(""); 
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
      console.log("Extracted Text:", detections[0].description);
      return detections[0].description; // Return extracted equation
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

// Main Function to Process Image and Solve Equation
async function solveImageQuestion(imagePath) {
  try {
    console.log("Preprocessing the image...");
    const processedImagePath = await preprocessImage(imagePath);

    console.log("Extracting text using Google Vision...");
    const extractedText = await extractTextFromImage(processedImagePath);
    const cleanedText = validateAndCleanText(extractedText);
    console.log("Cleaned Text:", cleanedText);

    console.log("Solving equation using Gemini AI...");
    const solution = await solveEquationWithGemini(cleanedText);

    console.log("\nFinal Solution:");
    console.log(solution);
  } catch (error) {
    console.error("Error processing the image:", error);
  }
}

// Clean and Validate Extracted Equation
function validateAndCleanText(text) {
  const equationRegex = /[a-zA-Z0-9\+\-\*\/\=\s]+/g;
  const matches = text.match(equationRegex);
  if (matches) {
    return matches.join("").replace(/\s+/g, ""); // Remove extra spaces
  }
  return text;
}

// Run the Program
solveImageQuestion("");