# 🧠 Algebra Solver AI (Image-Based)

This project is an intelligent backend system that accepts **handwritten or typed math problem images**, automatically extracts the content, and solves or checks the work using **Google Vision OCR** and **Gemini AI (Google Generative AI)**.

## 📸 What It Does

- 🧾 Accepts uploaded images containing algebra problems
- 🔍 Extracts text using Google Vision OCR
- 🧠 Interprets the content using Gemini AI to:
  - `QTAR`: Solve algebra problems
  - `CTAR`: Check a student’s solution for correctness
- 📤 Returns a detailed solution or annotated feedback

---

## 🏗️ Tech Stack

- **Node.js + Express** – REST API Server
- **Google Cloud Vision API** – Text detection from images
- **Gemini AI** (Generative AI from Google) – Natural language understanding and problem solving
- **Sharp** – Image preprocessing for OCR optimization
- **Multer** – Image upload handling
- **Body-parser & CORS** – API utilities

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/algebra-solver-ai.git
cd algebra-solver-ai
```

### 2. Install Dependencies

Use Node.js 22 or newer (the Docker image uses Node.js 24).

```bash
npm ci
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory and add:

```env
GEMINI_API_KEY=your_google_generative_ai_key
GOOGLE_APPLICATION_CREDENTIALS=path_to_your_google_credentials.json
```

> Ensure `GOOGLE_APPLICATION_CREDENTIALS` points to your Google Cloud Vision service account key JSON file.

---

## 🧪 API Usage

### POST `/solve`

Upload an image file containing a math problem or student solution.

**Supported Formats**: `.jpg`, `.jpeg`, `.png`, `.gif`

### Example (using `curl`):

```bash
curl -X POST http://localhost:3000/solve \
  -F image=@/path/to/image.png
```

#### `QTAR`

- Prefix your math problem with `QTAR`
- Triggers solution mode

#### `CTAR`

- Prefix a problem and student work with `CTAR`
- Triggers check-my-work mode

---

## ✅ Output Example

**Input Image (with text):**

```
QTAR x^2 + 5x + 6 = 0
```

**Output Response (JSON):**

```json
{
  "steps": "To solve the quadratic equation x^2 + 5x + 6 = 0...\nSteps:\n1. Factor the equation...\n2. Set each factor to 0...\n3. Solve for x..."
}
```

---

## 📁 Project Structure

```bash
.
├── Dockerfile              # Optional container setup
├── index.js                # Express server & endpoint logic
├── solveAlgebra.js         # Core OCR + AI logic
└── uploads/                # Uploaded images are temporarily saved here
```

---

## 🐳 Docker Support (Optional)

To build and run the app in Docker:

```bash
docker build -t algebra-solver .
docker run -p 3000:3000 \
  -v /absolute/path/to/google-credentials.json:/run/secrets/google.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/google.json \
  algebra-solver
```

---

## ⚠️ Notes

- Run `npm test` for dependency compatibility and upload regression checks, and `npm audit` for dependency advisories.
- Dependencies are installed from `package-lock.json`; do not commit `node_modules`.
- Mount Google Cloud credentials at runtime; they are excluded from the Docker build context.

- The image must clearly show the math problem.
- `QTAR` and `CTAR` are required tags for the system to understand the intent.
- Image preprocessing improves OCR reliability, especially for handwritten content.

---

## 🧠 Future Improvements

- Support for multi-step equations
- Add frontend interface for image upload
- Math rendering using LaTeX for solutions
- Improved student work feedback with visual annotations
- Model fine-tuning for common school-level errors

---

## 🧑‍💻 Author

**Bethvour**

> Have questions or suggestions? Open an issue or contribute!

---

## 📜 License

This project is licensed under the MIT License.
