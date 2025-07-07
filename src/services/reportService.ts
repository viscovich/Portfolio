import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url'; // 👈 importa il worker correttamente

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;


export const generateReport = async (file: File, prompt: string, provider: string) => {
  try {
    // Log all environment variables for debugging
    console.log('🔍 DEBUGGING REPORT GENERATION');
    console.log('📁 File:', file.name, 'Size:', file.size);
    console.log('🤖 Provider:', provider);
    console.log('📝 Prompt length:', prompt.length);
    
    // Check API key
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    console.log('🔑 API Key found:', !!apiKey);
    console.log('🔑 API Key length:', apiKey?.length || 0);
    console.log('🔑 API Key starts with:', apiKey?.substring(0, 10) + '...');
    console.log('🔑 Full API Key:', apiKey); // ATTENZIONE: rimuovi questo in produzione!
    
    // Log all environment variables
    console.log('🌍 All environment variables:');
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
    console.log('VITE_OPENROUTER_API_KEY length:', import.meta.env.VITE_OPENROUTER_API_KEY?.length);

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

    console.log('📄 Extracting PDF text...');
    const pdfText = await extractPdfText(file);
    console.log('📄 PDF text extracted, length:', pdfText.length);

    // Prepare request data
    const requestBody = {
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
    };

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Portfolio Report Generator'
    };

    console.log('🌐 Making API request to OpenRouter...');
    console.log('🔗 URL:', 'https://openrouter.ai/api/v1/chat/completions');
    console.log('📋 Headers:', {
      ...headers,
      'Authorization': `Bearer ${apiKey?.substring(0, 10)}...` // Mask the key in logs
    });
    console.log('📦 Request body model:', requestBody.model);
    console.log('📦 Request body messages count:', requestBody.messages.length);
    console.log('📦 Total content length:', JSON.stringify(requestBody).length);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response statusText:', response.statusText);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response received');
    console.log('📊 Response data keys:', Object.keys(data));
    console.log('📊 Choices count:', data.choices?.length || 0);
    
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};
