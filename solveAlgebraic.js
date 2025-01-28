const vision = require('@google-cloud/vision');
const algebra = require('algebra.js');
const sharp = require('sharp');

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

// Solve algebraic equation with detailed steps
function solveAlgebraicEquationDetailed(text) {
    const steps = [];
    const equationMatch = text.match(/([a-zA-Z0-9\s\+\-\*\/\=]+)/);

    if (equationMatch) {
        const equationString = equationMatch[0];
        try {
            const equation = algebra.parse(equationString);
            if (equation instanceof algebra.Equation) {
                steps.push(`Step 1: Extracted equation: ${equationString}`);

                // Start solving step-by-step
                let leftSide = equation.lhs.toString();
                let rightSide = equation.rhs.toString();
                steps.push(`Step 2: Start with the equation: ${leftSide} = ${rightSide}`);

                // Identify the variable
                const variable = equation.lhs.terms.find(term => term.variable)?.variable || 'x';
                steps.push(`Step 3: Identify the variable to solve for: '${variable}'`);

                // Step 1: Move constants to the other side
                const constantTerm = equation.lhs.terms.find(term => term.coefficients.length === 0);
                if (constantTerm) {
                    rightSide = `${rightSide} - ${constantTerm}`;
                    leftSide = leftSide.replace(`+ ${constantTerm}`, '').replace(`- ${constantTerm}`, '');
                    steps.push(`Step 4: Move constants to the other side: ${leftSide} = ${rightSide}`);
                }

                // Step 2: Solve for the coefficient of the variable
                const variableTerm = equation.lhs.terms.find(term => term.variable === variable);
                if (variableTerm) {
                    const coefficient = variableTerm.coefficients[0];
                    rightSide = `(${rightSide}) / ${coefficient}`;
                    leftSide = variable;
                    steps.push(`Step 5: Solve for the variable: ${leftSide} = ${rightSide}`);
                }

                // Evaluate the final solution
                const solution = eval(rightSide); // Calculate the numeric value
                steps.push(`Step 6: Final solution: ${variable} = ${solution}`);
            } else {
                steps.push("No valid equation found.");
            }
        } catch (error) {
            steps.push(`Error solving the equation: ${error.message}`);
        }
    } else {
        steps.push("No valid equation found.");
    }

    return steps;
}

// Main function
async function solveImageQuestion(imagePath) {
    try {
        console.log('Preprocessing the image...');
        const processedImagePath = await preprocessImage(imagePath);

        console.log('Extracting text from the image...');
        const extractedText = await extractTextFromImage(processedImagePath);

        const cleanedText = validateAndCleanText(extractedText);
        const steps = solveAlgebraicEquationDetailed(cleanedText);

        if (steps.length > 0) {
            console.log('Step-by-step solution:');
            steps.forEach((step, index) => {
                console.log(`Step ${index + 1}: ${step}`);
            });
        } else {
            console.log('No solvable algebraic equation detected.');
        }
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