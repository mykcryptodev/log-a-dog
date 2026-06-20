import { type FC } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion } from "motion/react";
import { CreateAttestation } from "~/components/Attestation/Create";

// Dynamically import ProfileButton with no SSR to prevent hydration issues
const ProfileButton = dynamic(
  () => import("../Profile/Button").then((mod) => ({ default: mod.ProfileButton })),
  { ssr: false, loading: () => null },
);

const openLogModal = () => {
  (document.getElementById("create_attestation_modal") as HTMLDialogElement | null)?.showModal();
};

const NavButton: FC<{
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ emoji, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
      active ? "text-primary" : "text-base-content/60"
    }`}
  >
    <div className="relative flex items-center justify-center">
      <span className="text-xl leading-none">{emoji}</span>
    </div>
    <span className="font-display text-[0.65rem] tracking-wide">{label}</span>
  </button>
);

export const BottomNav: FC = () => {
  const router = useRouter();
  const isActive = (path: string) => router.pathname === path;

  return (
    <>
      {/* Global upload machinery (modal + confetti + tx status) — the center
          Log button below opens it. No inline trigger or FAB. */}
      <CreateAttestation showTriggers={false} />

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-base-content/10 bg-base-100/80 backdrop-blur-lg">
        <div className="mx-auto grid h-20 max-w-md grid-cols-5 items-center px-2 pb-2">
          <NavButton
            emoji="🌭"
            label="Feed"
            active={isActive("/")}
            onClick={() => void router.push("/")}
          />
          <NavButton
            emoji="🏆"
            label="Leaderboard"
            active={isActive("/leaderboard")}
            onClick={() => void router.push("/leaderboard")}
          />

          {/* Raised, ceremonial center Log action. */}
          <div className="flex justify-center">
            <motion.button
              onClick={openLogModal}
              aria-label="Log a dog"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 12 }}
              className="-mt-8 h-16 w-16 overflow-hidden rounded-full border-4 border-base-100 shadow-dog-lg"
            >
              <Image
                src="/images/hotdog-icon.png"
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover"
                priority
              />
            </motion.button>
          </div>

          <NavButton
            emoji="🧑‍⚖️"
            label="Judge"
            active={isActive("/judges")}
            onClick={() => void router.push("/judges")}
          />
          <div className="flex items-center justify-center">
            <ProfileButton hideNameAndBadge label="You" />
          </div>
        </div>
      </nav>
    </>
  );
};
