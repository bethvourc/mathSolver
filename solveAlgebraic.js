const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const axios = require('axios');

// Initialize Google Cloud Vision client
const client = new vision.ImageAnnotatorClient({
    keyFilename: 'path-to-your-service-account-key.json', // Replace with your JSON key file path
});

// Preprocess the image using Sharp
async function preprocessImage(imagePath) {
    const processedPath = `${imagePath.split('.').slice(0, -1).join('.')}_processed.png`;

    try {
        await sharp(imagePath)
            .grayscale() // Convert to grayscale
            .normalise() // Normalize contrast
            .toFile(processedPath); // Save the processed image

        console.log('Image preprocessing complete:', processedPath);
        return processedPath;
    } catch (error) {
        console.error('Error during image preprocessing:', error);
        throw error;
    }
}

// Use Google Vision API for OCR
async function extractTextFromImage(imagePath) {
    try {
        const [result] = await client.textDetection(imagePath);
        const detections = result.textAnnotations;
        if (detections && detections.length > 0) {
            console.log('Extracted Text:', detections[0].description);
            return detections[0].description; // Return the first annotation (full text)
        } else {
            throw new Error('No text detected in the image.');
        }
    } catch (error) {
        console.error('Error during text extraction:', error);
        throw error;
    }
}

// Use Wolfram Alpha API to solve the equation
async function solveEquationWithWolframAlpha(equation) {
    const appId = 'YOUR_WOLFRAM_ALPHA_APPID'; // Replace with your Wolfram Alpha AppID
    const apiUrl = `http://api.wolframalpha.com/v2/query`;

    try {
        const response = await axios.get(apiUrl, {
            params: {
                input: equation,
                format: 'plaintext',
                output: 'JSON',
                appid: appId,
            },
        });

        const pods = response.data.queryresult.pods;
        const stepByStepPod = pods.find(pod => pod.title.toLowerCase().includes('step-by-step'));
        if (stepByStepPod) {
            return stepByStepPod.subpods.map(subpod => subpod.plaintext).join('\n');
        }

        // Fallback to other pods if step-by-step is not available
        const solutionPod = pods.find(pod => pod.title.toLowerCase().includes('result') || pod.title.toLowerCase().includes('solution'));
        if (solutionPod) {
            return solutionPod.subpods.map(subpod => subpod.plaintext).join('\n');
        }

        return 'No detailed solution available.';
    } catch (error) {
        console.error('Error with Wolfram Alpha API:', error);
        throw error;
    }
}

// Main function
async function solveImageQuestion(imagePath) {
    try {
        console.log('Preprocessing the image...');
        const processedImagePath = await preprocessImage(imagePath);

        console.log('Extracting text from the image...');
        const extractedText = await extractTextFromImage(processedImagePath);

        const cleanedText = validateAndCleanText(extractedText);
        console.log('Cleaned Text:', cleanedText);

        console.log('Solving the equation with Wolfram Alpha...');
        const detailedSteps = await solveEquationWithWolframAlpha(cleanedText);

        console.log('Step-by-step solution:');
        console.log(detailedSteps);
    } catch (error) {
        console.error('Error processing the image:', error);
    }
}

// Clean up extracted text
function validateAndCleanText(text) {
    const equationRegex = /[a-zA-Z0-9\+\-\*\/\=\s]+/g;
    const matches = text.match(equationRegex);
    if (matches) {
        return matches.join('').replace(/\s+/g, ''); // Remove spaces
    }
    return text;
}

// Run the program
solveImageQuestion('/mnt/data/image.jpeg');
