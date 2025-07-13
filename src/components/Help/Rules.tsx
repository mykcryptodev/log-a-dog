import Link from "next/link";
import { type FC } from "react";
import { LOG_A_DOG, DEFAULT_CHAIN } from "~/constants";

export const Rules: FC = () => {
  const activeChain = DEFAULT_CHAIN;

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold mx-auto">Rules and FAQs</h3>
        <div className="collapse collapse-arrow border-collapse border w-full bg-base-200 bg-opacity-30">
          <input type="checkbox" /> 
          <div className="collapse-title font-bold">
            What is Log a Dog?
          </div>
          <div className="collapse-content"> 
            <p className="font-bold">
              Log a Dog is a global competition with a simple, yet challenging goal:
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Eat as many hotdogs as you can during Summer 2025. (Jul 4 - Sep 1)</li>
              <li>Record each hotdog that you eat by uploading a pic of you eating it.</li>
              <li>Compete against participants from all around the world.</li>
              <li>Rate the truthfulness of other submissions.</li>
              <li>Win by being the one who logged the most dogs this summer.</li>
            </ul>
            <br />
            <p className="font-bold">
              Log a Dog is powered by A.I. and Blockchain technology
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Logging a dog records a transaction on the blockchain.</li>
              <li>Users make onchain attestations about your logs to prove truthfulness.</li>
              <li>There is an AI bot that will attest automatically based on what it sees in the image.</li>
              <li>The blockchain is an open protocol that people can build on top of. Find the contract code <Link href={`https://basescan.org/address/${LOG_A_DOG[activeChain.id]}#code`} className="text-primary" target="_blank" rel="noreferrer">here</Link>.</li>
            </ul>
          </div>
        </div>
        <div className="collapse collapse-arrow border-collapse border w-full bg-base-200 bg-opacity-30">
          <input type="checkbox" /> 
          <div className="collapse-title font-bold">
            What constitutes a hotdog?
          </div>
          <div className="collapse-content"> 
            <p className="font-bold">
              A valid hotdog:
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Is at least 4.8 inches long.</li>
              <li>Is in a bun (can be gluten-free but only if necessary).</li>
            </ul>
            <br />
            <p className="font-bold">
              What about sausages, brautwursts, or other sausage-like foods?
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Doesn&apos;t count.</li>
            </ul>
            <br />
            <p className="font-bold">
              What if I put two dogs on one bun?
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>That is one dog.</li>
            </ul>
            <br />
            <p className="font-bold">
              What if my hotdog is very long?
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>That is one dog.</li>
            </ul>
            <br />
            <p className="font-bold">
              Is x-amount of pigs-in-a-blanket equal to one hotdog?
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>No.</li>
            </ul>
            <br />
            <p className="font-bold">
              Do vegetarian or vegan hotdogs count?
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Yes, but we&apos;re not happy about it.</li>
            </ul>
            <br />
            <p className="font-bold">
              What role do condiments or toppings play?
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>None. You may eat the dog plain or add as many toppings as you&apos;d like.</li>
            </ul>
          </div>
        </div>
        <div className="collapse collapse-arrow border-collapse border w-full bg-base-200 bg-opacity-30">
          <input type="checkbox" /> 
          <div className="collapse-title font-bold">
            How do I earn from eating hotdogs?
          </div>
          <div className="collapse-content"> 
            <p className="font-bold">
              Eat to Earn
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Upload a pic of you eating a hotdog (one pic per dog).</li> 
              <li>Your pic is now a tradeable onchain token where you earn trading fees.</li>
              <li>There will be prizes for the people who eat the most hotdogs throughout the competition.</li>
            </ul>
            <br />
            <p className="font-bold">
              Moderate to Earn
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Stake $HOTDOG to become a judge.</li>
              <li>Upvote pics of people eating hotdogs. A pic of the dog is not enough, you need to see the person eating it!</li>
              <li>Downvote spam, duplicates, and other off-topic content.</li>
              <li>Incorrect votes will be slashed and the slashed amount will be distributed to the correct voters.</li>
            </ul>
            <br />
            <p className="font-bold">
              Learn More
            </p>
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>
                <Link href="/earn" className="text-secondary hover:underline">
                  Visit the earn page to learn more about earning opportunities
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="collapse collapse-arrow border-collapse border w-full bg-base-200 bg-opacity-30">
          <input type="checkbox" /> 
          <div className="collapse-title font-bold">
            Why does this exist?
          </div>
          <div className="collapse-content"> 
            <p className="font-bold">
              The world needs this.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Rules;