import { TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { type Profile } from "@prisma/client";
import { type FC,useContext, useState } from "react";

import { Portal } from "~/components/utils/Portal";
import Upload from "~/components/utils/Upload";
import NotificationContext from "~/context/Notification";
import { api } from "~/utils/api";

interface Props {
  profile: Profile | undefined | null;
  onSave: () => void;
}

export const ProfileGraphicsForm: FC<Props>= ({ profile, onSave }) => {
  const { popNotification } = useContext(NotificationContext);
  const [img, setImg] = useState<string>("");
  const [banner, setBanner] = useState<string>("");
  const updateProfile = api.profile.update.useMutation();

  const onSubmit = async () => {
    try {
      await updateProfile.mutateAsync({
        img,
        banner,
        id: profile?.id || "",
      });
      void onSave();
      popNotification({
        title: "Success",
        description: "Your profile has been updated.",
        type: "success"
      });
    } catch (e) {
      console.error({ e });
      popNotification({
        title: "Error",
        description: "There was an error updating your profile.",
        type: "error"
      });
    }
  };

  const handleRemoveGraphic = async (type: "logo" | "banner") => {
    try {
      if (type === "logo") {
        await updateProfile.mutateAsync({
          img: undefined,
          id: profile?.id || "",
        });
      }
      if (type === "banner") {
        await updateProfile.mutateAsync({
          banner: undefined,
          id: profile?.id || "",
        });
      }
      void onSave();
      popNotification({
        title: "Success",
        description: "Your graphic has been removed.",
        type: "success"
      });
    } catch (e) {
      const error = e as Error;
      console.error({ error });
      popNotification({
        title: "Error",
        description: "There was an error removing your graphic. " + error.message,
        type: "error"
      });
    }
  }

  interface RemoveGraphicModalProps {
    type: "logo" | "banner"
  }

  const RemoveGraphicModal: FC<RemoveGraphicModalProps> = ({ type }) => {
    return (
      <>
        {/* The button to open modal */}
        <label htmlFor={`remove-graphic-modal-${type}`} className="btn btn-xs btn-ghost">
          <TrashIcon className="w-4 h-4 stroke-2" />
          Remove
        </label>

        <Portal>
          <input type="checkbox" id={`remove-graphic-modal-${type}`} className="modal-toggle" />
          <div className="modal modal-bottom sm:modal-middle">
            <div className="modal-box relative">
              <label htmlFor={`remove-graphic-modal-${type}`} className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">
                <XMarkIcon className="h-4 w-4 stroke-2" />
              </label>
              <h3 className="font-bold text-lg">Remove Graphic</h3>
              <p className="py-4">Are you sure you want to remove this graphic? This action cannot be undone.</p>
              <div className="modal-action">
                <label htmlFor={`remove-graphic-modal-${type}`} className="btn">Cancel</label>
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={() => void handleRemoveGraphic(type)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </Portal>
      </>
    )
  }
  
  return (
    <form>
      <div className="flex flex-col gap-2">
        <div className="form-control">
          <label className="label">
            <span className="label-text text-lg">Profile image</span>
          </label>
          <div className="text-sm pb-2">
            This image will be used for display purposes
          </div>
          <Upload 
            key="logo"
            initialUrls={profile?.img ? [profile.img] : []}
            callback={(url) => setImg(url[0] || "")}
          />
          <div className="w-full flex justify-end mt-2">
            <RemoveGraphicModal type="logo" />
          </div>
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text text-lg">Banner image</span>
          </label>
          <div className="text-sm pb-2">
            This image will appear at the top of your profile page
          </div>
          <Upload 
            key="banner"
            initialUrls={profile?.banner ? [profile.banner] : []}
            callback={(url) => setBanner(url[0] || "")}
          />
          <div className="w-full flex justify-end mt-2">
            <RemoveGraphicModal type="banner" />
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg mt-4"
          onClick={() => void onSubmit()}
        >
          Save
        </button>
      </div>
    </form>
  )
}

export default ProfileGraphicsForm;