import { useEffect, useRef } from 'react';
import { mountLoanCalculator } from '../src/ui.mjs';
import '../src/styles.css';
import '../src/brand-fonts.css';

export interface LoanCalculatorAppProps {
  logo?: string;
  initialTab?: 'short' | 'long' | 'compare';
}

/** A scoped React adapter to the same deterministic calculation and report engine. */
export default function LoanCalculatorApp({logo, initialTab = 'short'}: LoanCalculatorAppProps) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (host.current) return mountLoanCalculator(host.current, {logo, initialTab});
  }, [logo, initialTab]);
  return <div ref={host} aria-label="Công cụ tính lãi vay và lập phương án trả nợ" />;
}
