import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <section className={`rounded-lg border border-surface-200 bg-white p-5 ${className}`.trim()}>
      {children}
    </section>
  );
}
