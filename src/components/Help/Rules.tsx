import Link from "next/link";
import { type FC } from "react";
import { DEFAULT_CHAIN, LOG_A_DOG } from "~/constants";
import FaqArticle from "~/components/Help/FaqArticle";
import FaqSection from "~/components/Help/FaqSection";

export const Rules: FC = () => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xl">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold mx-auto">Rules and FAQs</h3>
        <FaqArticle number={1} title="What is Log a Dog?">
          <FaqSection letter="A" title="Log a Dog is a global competition with a simple, yet challenging goal:">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Eat as many hotdogs as you can during Summer 2026. (Jul 4 - Sep 7)</li>
              <li>Record each hotdog that you eat by uploading a pic of you eating it.</li>
              <li>Compete against participants from all around the world.</li>
              <li>Rate the truthfulness of other submissions.</li>
              <li>Compete throughout the summer — creative and dedicated loggers get rewarded along the way.</li>
            </ul>
          </FaqSection>
          <br />
          <FaqSection letter="B" title="Log a Dog is powered by A.I. and Blockchain technology">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Logging a dog records a transaction on the blockchain.</li>
              <li>Users make onchain attestations about your logs to prove truthfulness.</li>
              <li>There is an AI bot that will attest automatically based on what it sees in the image.</li>
              <li>The blockchain is an open protocol that people can build on top of. Find the contract code <Link href={`https://basescan.org/address/${LOG_A_DOG[DEFAULT_CHAIN.id]}#code`} className="text-primary" target="_blank" rel="noreferrer">here</Link>.</li>
            </ul>
          </FaqSection>
        </FaqArticle>
        <FaqArticle number={2} title="What constitutes a hotdog?">
          <FaqSection letter="A" title="A valid hotdog:">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Is at least 4.8 inches long.</li>
              <li>Is in a bun (can be gluten-free but only if necessary).</li>
            </ul>
          </FaqSection>
          <br />
          <FaqSection letter="B" title="What about sausages, brautwursts, or other sausage-like foods?">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Doesn&apos;t count.</li>
            </ul>
          </FaqSection>
          <br />
          <FaqSection letter="C" title="What if I put two dogs on one bun?">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>That is one dog.</li>
            </ul>
          </FaqSection>
          <br />
          <FaqSection letter="D" title="What if my hotdog is very long?">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>That is one dog.</li>
            </ul>
          </FaqSection>
          <br />
          <FaqSection letter="E" title="Is x-amount of pigs-in-a-blanket equal to one hotdog?">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>No.</li>
            </ul>
          </FaqSection>
          <br />
          <FaqSection letter="F" title="Do vegetarian or vegan hotdogs count?">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Yes, but we&apos;re not happy about it.</li>
            </ul>
          </FaqSection>
          <br />
          <FaqSection letter="G" title="What role do condiments or toppings play?">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>None. You may eat the dog plain or add as many toppings as you&apos;d like.</li>
            </ul>
          </FaqSection>
        </FaqArticle>
        <FaqArticle number={3} title="How do I earn from eating hotdogs?">
          <FaqSection letter="A" title="Eat to Earn">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Upload a pic of you eating a hotdog (one pic per dog).</li> 
              <li>Your pic is now a tradeable onchain token where you earn trading fees.</li>
              <li>There will be rewards throughout the summer for creative and standout logged dogs.</li>
            </ul>
          </FaqSection>
          <br />
          <FaqSection letter="B" title="Moderate to Earn">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>Stake $HOTDOG to become a judge.</li>
              <li>Upvote pics of people eating hotdogs. A pic of the dog is not enough, you need to see the person eating it!</li>
              <li>Downvote spam, duplicates, and other off-topic content.</li>
              <li>Incorrect votes will be slashed and the slashed amount will be distributed to the correct voters.</li>
            </ul>
          </FaqSection>
          <br />
          <FaqSection letter="C" title="Learn More">
            <ul style={{listStyleType: 'circle'}} className="ml-5">
              <li>
                <Link href="/earn" className="text-secondary hover:underline">
                  Visit the earn page to learn more about earning opportunities
                </Link>
              </li>
            </ul>
          </FaqSection>
        </FaqArticle>
        <FaqArticle number={4} title="Why does this exist?">
          <FaqSection letter="A" title="The world needs this." />
        </FaqArticle>
      </div>
    </div>
  )
};

export default Rules;
