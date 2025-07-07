declare module '../services/reportService' {
  export const generateReport: (
    file: File,
    prompt: string,
    provider: string
  ) => Promise<string>;
}
