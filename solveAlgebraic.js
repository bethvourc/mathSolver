const vision = require('@google-cloud/vision');
const algebra = require('algebra.js');
const sharp = require('sharp');

// Initialize Google Cloud Vision client
const client = new vision.ImageAnnotatorClient({
    keyFilename: '', // Replace with your JSON key file path
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
            if (!(equation instanceof algebra.Equation)) {
                steps.push("No valid equation found.");
                return steps;
            }

            steps.push(`Extracted equation: ${equationString}`);
            let currentEquation = equation;
            steps.push(`Start with the equation: ${currentEquation.toString()}`);

            // Separate variable and constant terms
            let variableTerm = null;
            let constantSum = 0;
            currentEquation.lhs.terms.forEach(term => {
                if (term.variables.length > 0) {
                    variableTerm = term;
                } else {
                    constantSum += term.coefficients[0]; // Sum all constant terms
                }
            });

            if (constantSum !== 0) {
                currentEquation = new algebra.Equation(
                    currentEquation.lhs.subtract(constantSum),
                    currentEquation.rhs.subtract(constantSum)
                );
                steps.push(`Move constants to the other side: ${currentEquation.toString()}`);
            } else {
                steps.push(' No constants to move.');
            }

            // Divide by the coefficient of the variable
            if (!variableTerm) {
                steps.push("Error: No variable found in the equation.");
                return steps;
            }

            const coefficient = variableTerm.coefficients[0];
            if (coefficient !== 1) {
                currentEquation = new algebra.Equation(
                    currentEquation.lhs.divide(coefficient),
                    currentEquation.rhs.divide(coefficient)
                );
                steps.push(`Divide by the coefficient of the variable: ${currentEquation.toString()}`);
            }

            // Final solution
            const rhsString = currentEquation.rhs.toString();
            const solution = eval(rhsString); // Evaluate the numeric output
            steps.push(`Step 5: Final solution: ${variableTerm.variables[0]} = ${solution}`);
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
solveImageQuestion('');