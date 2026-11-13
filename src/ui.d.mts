export interface LoanCalculatorOptions {
  logo?: string;
  fontCss?: string;
  initialTab?: 'short' | 'long' | 'compare';
  restricted?: boolean;
}
export function mountLoanCalculator(host: HTMLElement, options?: LoanCalculatorOptions): () => void;
