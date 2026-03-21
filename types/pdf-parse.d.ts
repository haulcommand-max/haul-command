declare module 'pdf-parse' {
    interface PDFParseResult {
        numpages: number;
        numrender: number;
        info: Record<string, unknown>;
        metadata: Record<string, unknown>;
        version: string;
        text: string;
    }
    function pdfParse(dataBuffer: Buffer): Promise<PDFParseResult>;
    export default pdfParse;
}
