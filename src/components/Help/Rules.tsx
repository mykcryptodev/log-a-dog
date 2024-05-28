import Link from "next/link";
import { type FC } from "react";

export const Rules: FC = () => {
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
              <li>Eat as many hotdogs as you can during Summer 2024.</li>
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
              <li>The blockchain is an open protocol that people can build on top of. Find the contract code <Link href="https://basescan.org/address/0x82f276c283948b81f17ea5a98906bd3159ccf4f5#code" className="text-primary" target="_blank" rel="noreferrer">here</Link>.</li>
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