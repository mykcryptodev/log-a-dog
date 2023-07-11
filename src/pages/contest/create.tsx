import { type NextPage } from "next";
import { useContext } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

import NotificationContext from "~/context/Notification";
import { api } from "~/utils/api";

interface IFormInput {
  name: string;
  description: string;
  slug: string;
  start: Date;
  end: Date;
}

export const CreateContest: NextPage = () => {
  const { popNotification } = useContext(NotificationContext);
  const create = api.contest.create.useMutation();
  const join = api.contest.join.useMutation();
  const { register, handleSubmit } = useForm<IFormInput>({
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      start: new Date(),
      end: new Date(),
    },
  });

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    try {
      const contest = await create.mutateAsync({
        name: data.name,
        description: data.description,
        slug: data.slug,
        start: data.start,
        end: data.end,
      });
      // make the user join the contest
      await join.mutateAsync({
        contestId: contest.id,
      });
      popNotification({
        title: "Success",
        description: "Your contest has been updated.",
        type: "success"
      });
    } catch (e) {
      console.error({ e });
      const error = e as Error;
      popNotification({
        title: "Error",
        description: "There was an error creating your contest. " + error.message,
        type: "error"
      });
    }
  }
  
  return (
    <div>
      <h1 className="text-5xl font-bold mb-8">
        Create
      </h1>
      <div className="w-full flex justify-center">
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl w-full">
          <div className="flex flex-col gap-2">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg capitalize">Name</span>
              </label>
              <input
                type="text"
                className="input input-lg input-bordered w-full"
                {...register("name")}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg capitalize">Slug</span>
              </label>
              <input
                type="text"
                className="input input-lg input-bordered w-full"
                {...register("slug")}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-lg capitalize">Description</span>
              </label>
              <textarea
                rows={5}
                className="textarea textarea-bordered textarea-lg w-full"
                {...register("description")}
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
      </div>
    </div>
  )
};

export default CreateContest;