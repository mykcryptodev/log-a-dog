import { type FC } from "react";

type Props = {
  contestId: number;
}
export const AddContestant: FC<Props> = ({ contestId }) => {
  return (
    <div> Add Contestant to { contestId } </div>
  )
};

export default AddContestant;