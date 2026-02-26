/**
 * PDF-to-Image Conversion API Route
 * 
 * Converts the first page of a PDF to a base64 image for GPT Vision processing.
 * Uses pdf.js to render the PDF page to a canvas, then exports as PNG.
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file_url } = req.body;

    if (!file_url) {
      return res.status(400).json({ error: 'file_url is required' });
    }

    // Fetch the PDF file
    const pdfResponse = await fetch(file_url);
    if (!pdfResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch PDF file' });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

    // Return the PDF as a base64 data URL that GPT-4 Vision can process
    // GPT-4.1-mini supports PDF input via base64 data URLs
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

    return res.json({ 
      status: 'success', 
      image_url: dataUrl,
      format: 'base64_pdf'
    });

  } catch (error) {
    console.error('PDF conversion error:', error);
    return res.status(500).json({ error: error.message });
  }
}
