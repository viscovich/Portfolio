declare module '../services/reportService' {
  export function generateReport(
    file: File, 
    prompt: string, 
    provider: string
  ): Promise<string>;
}
