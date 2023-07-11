import { ArrowLeftIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { type Profile } from "@prisma/client";
import { useRouter } from "next/router";
import { type FC } from "react";

import CreateReport from "~/components/Report/Create";

interface Props {
  profile?: Profile;
  onProceed: () => void;
}

export const CensoredContent: FC<Props> = ({ onProceed, profile }) => {
  const router = useRouter();
  return (
    <div className="min-h-screen min-w-screen h-full w-full backdrop-blur text-center">
      <div className="flex flex-col gap-4 w-full justify-center items-center">
        <ShieldExclamationIcon className="w-20 h-20 stroke-2" />
        <span className="text-5xl font-bold">
          Censored Content
        </span>
        <span className="text-xl">
          The community has deemed this content inappropriate and has censored it.
        </span>
        <button className="btn btn-primary btn-lg" onClick={() => void router.back()}>
          <ArrowLeftIcon className="w-6 h-6 stroke-2" />
          Back to safety
        </button>
        <button className="btn btn-xs btn-warning mt-20" onClick={() => onProceed()}>
          Proceed to content
        </button>
        <CreateReport profile={profile} className="btn btn-xs">
          <div>This content should not be censored</div>
        </CreateReport>
      </div>
    </div>
  )
};

export default CensoredContent;