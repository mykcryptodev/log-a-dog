import { type FC } from "react";
import { Stake } from "./Stake";

type Props = {
  isOpen: boolean;
  onClose: () => void;
}

export const InsufficientStake: FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open={isOpen}>
      <div className="modal-box relative">
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-lg font-bold">🧑‍⚖️ Get paid to be a judge!</h2>
        <p className="text-sm opacity-70 mb-2">You can earn $HOTDOG by attesting to the validity logs.</p>
        <p className="mb-2">Stake $HOTDOG to become a judge and start earning rewards.</p>
        <Stake onStake={onClose} hideTitle />
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};