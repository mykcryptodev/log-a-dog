import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { type Profile } from "@prisma/client";
import Link from "next/link";
import { type FC,useContext } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

import NotificationContext from "~/context/Notification";
import { api } from "~/utils/api";

interface FormInput {
  name: string;
  bio: string;
}

interface Props {
  profile: Profile | undefined | null;
}

export const ProfileDetailsForm: FC<Props> = ({ profile }) => {
  const { popNotification } = useContext(NotificationContext);
  const updateProfile = api.profile.update.useMutation();
  const createProfile = api.profile.create.useMutation();
  const { register, handleSubmit, watch } = useForm<FormInput>({
    defaultValues: {
      name: profile?.name || "",
      bio: profile?.bio || ""
    },
  });

  const name = watch("name");

  const profileUrl = `https://${process.env.NEXT_PUBLIC_SITE_URL || ""}/profile/${name.replace(/ /g,'_')}`;

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    try {
      // if there is no profile, create one
      if (!profile) {
        await createProfile.mutateAsync({
          name: data.name,
          bio: data.bio,
        });
        popNotification({
          title: "Success",
          description: "Your profile has been created.",
          type: "success"
        });
        return;
      }
      await updateProfile.mutateAsync({
        id: profile?.id || "",
        userId: profile?.userId || "",
        name: data.name,
        bio: data.bio,
      });
      popNotification({
        title: "Success",
        description: "Your profile has been updated.",
        type: "success"
      });
    } catch (e) {
      console.error({ e });
      const error = e as Error;
      popNotification({
        title: "Error",
        description: "There was an error updating your profile. " + error.message,
        type: "error"
      });
    }
  }

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2">
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg capitalize">Name</span>
            </label>
            <div className="text-sm pb-2">
              This is the name of your profile. It will be displayed everywhere instead of your address. It must be unique.
            </div>
            <input
              type="text"
              className="input input-lg input-bordered w-full"
              {...register("name")}
            />
            <label className="label">
              <span></span>
              <span className="label-text-alt flex items-center gap-1">
                <span>Your profile url is:</span>
                <Link href={profileUrl} className="font-bold">{profileUrl}</Link>
                <DocumentDuplicateIcon 
                  className="w-4 h-4 stroke-2 inline-block cursor-pointer"
                  onClick={() => {
                    void navigator.clipboard.writeText(profileUrl);
                    popNotification({
                      title: "Copied",
                      description: "Your profile url has been copied to your clipboard.",
                      type: "success"
                    });
                  }}
                />
              </span>
            </label>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg capitalize">Bio</span>
            </label>
            <div className="text-sm pb-2">
              This is your profile biography. It will be displayed on your profile page.
            </div>
            <textarea
              rows={5}
              className="textarea textarea-bordered textarea-lg w-full"
              {...register("bio")}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-4"
            onClick={() => handleSubmit(onSubmit)}
          >
            Save
          </button>
        </div>
      </form>
    </>
  )
}

export default ProfileDetailsForm;