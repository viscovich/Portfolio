export const generateReport = async (file: File, prompt: string, provider: string) => {
  try {
    // Read file as base64 using FileReader
    const base64File = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Extract base64 data from data URL
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

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
            content: "Analizza il PDF del portafoglio e rispondi in italiano con un'analisi finanziaria professionale. Formatta la risposta in markdown con sezioni e tabelle."
          },
          {
            role: "user",
            content: prompt,
            attachments: [
              {
                name: file.name,
                content: base64File,
                mime_type: "application/pdf"
              }
            ]
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
