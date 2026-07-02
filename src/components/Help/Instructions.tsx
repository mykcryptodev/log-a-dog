import { type FC } from "react";
import { Tweet } from "react-tweet";
import FaqArticle from "~/components/Help/FaqArticle";

export const Instructions: FC = () => {
  return (
    <div className="max-w-2xl">
      <div className="flex flex-col gap-4">
        <h3 className="text-2xl font-bold mx-auto">Instructions</h3>
        <ul className="steps steps-vertical md:steps-horizontal">
          <li className="step">
            <div className="grid grid-rows-2">
              <span className="font-bold text-start md:text-center">Log a dog</span>
              <span className="text-xs">Upload a picture of you eating a hotdog. One pic per dog.</span>
            </div>
          </li>
          <li className="step">
            <div className="grid grid-rows-2">
              <span className="font-bold text-start md:text-center">Climb the leaderboard</span>
              <span className="text-xs">Keep logging — creative dogs get rewarded throughout the summer.</span>
            </div>
          </li>
        </ul>
        <div className="w-full justify-center flex items-center">
          <div className="max-w-xl w-full">
            <FaqArticle number={5} title="Instructional Video">
              <div className="w-full flex justify-center">
                <Tweet id="1805324646855983453" />
              </div>
            </FaqArticle>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Instructions;
