import { type Profile } from '@prisma/client';
import { type FC, useContext } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import NotificationContext from '~/context/Notification';
import { api } from '~/utils/api';

interface IFormInput {
  twitter: string;
  discord: string;
  instagram: string;
}

interface Props {
  profile: Profile | undefined | null;
}

export const ProfileLinksForm: FC<Props> = ({ profile }) => {
  const { popNotification } = useContext(NotificationContext);
  const updateProfile = api.profile.update.useMutation();
  const { register, handleSubmit } = useForm<IFormInput>({
    defaultValues: {
      twitter: profile?.twitter || "",
      discord: profile?.discord || "",
      instagram: profile?.instagram || "",
    },
  });

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    try {
      await updateProfile.mutateAsync({
        id: profile?.id || "",
        userId: profile?.userId || "",
        twitter: data.twitter,
        discord: data.discord,
        instagram: data.instagram,
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
              <span className="label-text text-lg capitalize">Twitter</span>
            </label>
            <input
              type="text"
              className="input input-lg input-bordered w-full"
              {...register("twitter")}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg capitalize">Discord</span>
            </label>
            <input
              type="text"
              className="input input-lg input-bordered w-full"
              {...register("discord")}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg capitalize">Instagram</span>
            </label>
            <input
              type="text"
              className="input input-lg input-bordered w-full"
              {...register("instagram")}
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

export default ProfileLinksForm;