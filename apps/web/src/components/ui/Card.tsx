import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: Props) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
