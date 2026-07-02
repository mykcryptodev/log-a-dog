import { type FC, type ReactNode } from "react";

interface FaqSectionProps {
  letter: string;
  title: string;
  children?: ReactNode;
}

export const FaqSection: FC<FaqSectionProps> = ({ letter, title, children }) => {
  return (
    <>
      <p className="font-bold">
        <span className="text-secondary">Section {letter}</span>
        {" — "}
        {title}
      </p>
      {children ?? null}
    </>
  );
};

export default FaqSection;
