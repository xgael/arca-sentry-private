import type { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

export default function Card({ title, subtitle, className, children }: CardProps) {
  return (
    <section className={clsx("card", className)}>
      {(title || subtitle) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {subtitle && <div className="muted">{subtitle}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
