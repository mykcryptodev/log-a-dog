import { type FC, type ReactNode } from "react";

interface FaqArticleProps {
  number: number;
  title: string;
  children: ReactNode;
}

export const FaqArticle: FC<FaqArticleProps> = ({ number, title, children }) => {
  return (
    <div className="collapse collapse-arrow border-collapse border w-full bg-base-200 bg-opacity-30">
      <input type="checkbox" />
      <div className="collapse-title font-bold">
        <span className="text-secondary">Article {number}</span>
        {" — "}
        {title}
      </div>
      <div className="collapse-content">{children}</div>
    </div>
  );
};

export default FaqArticle;
