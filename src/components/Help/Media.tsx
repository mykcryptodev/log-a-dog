import { type FC } from "react";
import Image from "next/image";
import Link from "next/link";

export const Media: FC = () => {
  return (
    <div className="max-w-2xl">
      <div className="flex flex-col gap-4">
        <h3 className="text-2xl font-bold mx-auto">Media</h3>
        <div className="w-full justify-center flex flex-col gap-2 items-center">
          <div className="max-w-xl collapse collapse-arrow border-collapse border w-full bg-base-200 bg-opacity-30">
            <input type="checkbox" /> 
            <div className="collapse-title font-bold">
              Podcast Episode
            </div>
            <div className="collapse-content"> 
              <p className="mb-4">
                Listen to the ta$te podcast episode about Log a Dog:
              </p>
              <iframe 
                src="https://pods.media/embed/player/con-gusto/ep4-are-hotdogs-sandwiches-with-myk?referrer=0x653Ff253b0c7C1cc52f484e891b71f9f1F010Bfb" 
                width="100%" 
                height="144px" 
                className="rounded-lg"
              />
              <p className="text-sm mt-2 opacity-75">
                Episode 4: "Are Hotdogs Sandwiches?" - A deep dive into the Log a Dog app and the eternal hotdog debate.
              </p>
            </div>
          </div>
          <div className="max-w-xl collapse collapse-arrow border-collapse border w-full bg-base-200 bg-opacity-30">
            <input type="checkbox" /> 
            <div className="collapse-title font-bold">
              Interview with Season 1 Winner: Cool Beans!
            </div>
            <div className="collapse-content"> 
              <p className="mb-4">
                Listen to the interview with the Season 1 winner: Cool Beans!
              </p>
                <Link href="https://zora.co/coin/base:0xee78b6b03a705e9bd926b5c515a913c0bda39078?referrer=0x653ff253b0c7c1cc52f484e891b71f9f1f010bfb">
                  <Image 
                    src="/images/interview.jpg" 
                    alt="Cool Beans" 
                    className="rounded-lg"
                    width={1191}
                    height={609} 
                  />
                </Link>
              <p className="text-sm mt-2 opacity-75">
                Interview with Season 1 winner: Cool Beans on Zora!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Media;