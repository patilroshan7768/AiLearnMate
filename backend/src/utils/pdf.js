const fs = require('fs');
const pdfModule = require('pdf-parse');

const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        
        // 1. Check if it's the modern Mehmet Kozan pdf-parse package (Namespace with PDFParse class)
        if (pdfModule && pdfModule.PDFParse) {
            const uint8Array = new Uint8Array(dataBuffer);
            const parser = new pdfModule.PDFParse(uint8Array);
            await parser.load();
            const pages = await parser.getText();
            
            if (pages) {
                if (typeof pages.text === "string") {
                    return pages.text;
                }
                if (Array.isArray(pages.pages)) {
                    return pages.pages.map(page => page.text || "").join("\n");
                }
                if (Array.isArray(pages)) {
                    return pages.map(page => page.text || "").join("\n");
                }
            }
        }
        
        // 2. Check if it's the legacy standard pdf-parse function export
        if (typeof pdfModule === "function") {
            const data = await pdfModule(dataBuffer);
            return data.text;
        }

        // 3. Check if standard function is exported on default property
        if (pdfModule && typeof pdfModule.default === "function") {
            const data = await pdfModule.default(dataBuffer);
            return data.text;
        }

        throw new Error("No valid PDF parsing engine found.");
    } catch (error) {
        console.error("[extractTextFromPDF] Error:", error.message);
        throw new Error("Failed to parse PDF file: " + error.message);
    }
};

module.exports = { extractTextFromPDF };
