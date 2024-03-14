import { type NextPage } from "next";
import { ContestForm } from "~/components/Contest/Form";

export const CreateContest: NextPage = () => {
  return (
    <div className="flex w-full justify-center flex-col gap-2 h-full items-center min-h-screen">
      <h1 className="font-bold text-2xl text-center mb-4">Create Contest</h1>
      <ContestForm action="create" />
    </div>
  )
}

export default CreateContest;