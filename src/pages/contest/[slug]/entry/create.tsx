import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

import Breadcrumbs from "~/components/utils/Breadcrumbs";
import Upload from "~/components/utils/Upload";
import NotificationContext from "~/context/Notification";
import withSignedInProtection from "~/hoc/withSignedInProtection";
import { api } from "~/utils/api";

interface FormInput {
  amount: number;
}

export const CreateEntry: NextPage = () => {
  const { popNotification } = useContext(NotificationContext);
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const { data: contest } = api.contest.getBySlug.useQuery({ slug });
  const submitEntry = api.contest.submitEntry.useMutation();
  const [imgUrl, setImg] = useState<string>("");
  const { register, handleSubmit } = useForm<FormInput>({
    defaultValues: {
      amount: 1,
    },
  });

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    if (!contest?.id) return;
    try {
      await submitEntry.mutateAsync({
        amount: Number(data.amount),
        contestId: contest.id,
        image: imgUrl,
      });
      popNotification({
        title: "Success",
        description: "Your entry has been created.",
        type: "success"
      });
    } catch (e) {
      console.error({ e });
      const error = e as Error;
      popNotification({
        title: "Error",
        description: "There was an error creating your entry. " + error.message,
        type: "error"
      });
    }
  };

  if (contest) {
    return (
      <div>
        <Breadcrumbs
          currentPaths={[
            `/contest/${slug}`,
            `/contest/${slug}/entry/create`
          ]}
          currentPathNames={[
            contest.name,
            "Log a Dog"
          ]}
        />
        <h1 className="text-5xl font-bold">
          Log a Dog
        </h1>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <div className="py-4">
            <Upload 
              key="logo"
              initialUrls={imgUrl ? [imgUrl] : []}
              callback={(url) => setImg(url[0] || "")}
            />
          </div>
          <div className="flex flex-col gap-4">
            <label htmlFor="amount" className="text-lg font-bold">Amount</label>
            <input
              id="amount"
              className="input input-lg input-bordered"
              type="number"
              {...register("amount")}
            />
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>
        </form>
      </div>
    );
  }
  return null;
};

export default withSignedInProtection(CreateEntry);