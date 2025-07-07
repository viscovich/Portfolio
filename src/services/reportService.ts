import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'; // 👈 importa il worker correttamente

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;


export const generateReport = async (file: File, prompt: string, provider: string) => {
  try {
    // Extract text from PDF
    const extractPdfText = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const textContent = await page.getTextContent();
        // Filter out non-text items and extract text
        const pageText = textContent.items
          .filter(item => (item as any).str) // Ensure item has str property
          .map(item => (item as any).str)    // Extract text content
          .join(' ');
        fullText += `\n\n--- Pagina ${i + 1} ---\n\n${pageText}`;
      }
      return fullText;
    };

    const pdfText = await extractPdfText(file);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Portfolio Report Generator'
      },
      body: JSON.stringify({
        model: provider,
        messages: [
          {
            role: "system",
            content: "Analizza il testo estratto da un PDF di portafoglio e genera un report finanziario professionale in italiano. Usa markdown con sezioni e tabelle."
          },
          {
            role: "user",
            content: `${prompt}\n\n--- TESTO ESTRATTO DAL PDF ---\n${pdfText}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};
