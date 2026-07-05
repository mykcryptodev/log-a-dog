import Image from "next/image";
import Link from "next/link";
import { type FC } from "react";

type Props = {
  label?: string;
  className?: string;
};

export const BankrSkillLink: FC<Props> = ({
  label = "Judge with Bankr",
  className = "",
}) => (
  <Link
    href="/bankr-skill"
    className={`pop-card group flex w-full items-center justify-center gap-3 rounded-2xl bg-base-100 px-4 py-3 transition-transform hover:-translate-y-0.5 ${className}`}
  >
    <Image
      src="/images/bankr.jpg"
      alt=""
      width={40}
      height={40}
      className="size-10 shrink-0 rounded-xl object-cover shadow-md"
    />
    <span className="font-display text-sm tracking-wide sm:text-base">{label}</span>
  </Link>
);

export default BankrSkillLink;
