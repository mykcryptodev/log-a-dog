import { type NextPage } from "next";
import { Stake } from "~/components/Stake/Stake";
import { 
  CurrencyDollarIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  TrophyIcon,
  ExclamationTriangleIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { Buy } from "~/components/utils/Buy";

const EarnPage: NextPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Earn <span className="text-secondary">$HOTDOG</span>
          </h1>
          <p className="mt-4 text-xl text-base-content/70">
            Stake your tokens and moderate submissions to earn rewards
          </p>
          <p className="mt-4 mb-2 text-base-content/70">
            Need some $HOTDOG?
          </p>
          <Buy />
        </div>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
          
          {/* Staking Component */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <Stake />
            </div>
          </div>

          {/* Information Panel */}
          <div className="space-y-6">
            
            {/* How It Works */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-6 w-6" />
                  How Earning Works
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="badge badge-primary badge-lg">1</div>
                    <div>
                      <h3 className="font-semibold">Stake $HOTDOG</h3>
                      <p className="text-sm text-base-content/70">
                        Stake your $HOTDOG tokens to earn 10% APY and participate in moderation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-primary badge-lg">2</div>
                    <div>
                      <h3 className="font-semibold">Judge Submissions</h3>
                      <p className="text-sm text-base-content/70">
                        Vote on hotdog submissions to help maintain quality and earn additional rewards
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-primary badge-lg">3</div>
                    <div>
                      <h3 className="font-semibold">Earn Rewards</h3>
                      <p className="text-sm text-base-content/70">
                        Win rewards from incorrect voters and earn staking yields
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Voting Guidelines */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
                  <ShieldCheckIcon className="h-6 w-6" />
                  Voting Guidelines
                </h2>
                <div className="space-y-3">
                  <div className="alert alert-error bg-error/10 text-base-content">
                    <HandThumbDownIcon className="h-5 w-5" />
                    <div>
                      <h4 className="font-semibold">Downvote if:</h4>
                      <ul className="text-sm mt-1 space-y-1">
                        <li>• Image doesn&apos;t show someone eating a hotdog</li>
                        <li>• Submission is a duplicate entry</li>
                        <li>• Content violates competition spirit</li>
                        <li>• Image is inappropriate or spam</li>
                      </ul>
                    </div>
                  </div>
                  <div className="alert alert-success bg-success/10 text-base-content">
                    <HandThumbUpIcon className="h-5 w-5" />
                    <div>
                      <h4 className="font-semibold">Upvote if:</h4>
                      <ul className="text-sm mt-1 space-y-1">
                        <li>• Person is clearly eating a hotdog</li>
                        <li>• Image is original and authentic</li>
                        <li>• Submission follows all guidelines</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Voting Process */}
        <div className="card bg-base-100 shadow-xl w-full max-w-4xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6 flex items-start gap-2">
              <ClockIcon className="h-6 w-6 mt-1" />
              Voting Process & Rewards
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheckIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Vote with Stake</h3>
                <p className="text-sm text-base-content/70">
                  Stake minimum 50 $HOTDOG on your vote. Higher stakes = higher potential rewards.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-warning/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <ClockIcon className="h-8 w-8 text-warning" />
                </div>
                <h3 className="font-semibold mb-2">48-Hour Window</h3>
                <p className="text-sm text-base-content/70">
                  Voting closes 48 hours after submission. Make sure to vote before the deadline!
                </p>
              </div>

              <div className="text-center">
                <div className="bg-success/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <TrophyIcon className="h-8 w-8 text-success" />
                </div>
                <h3 className="font-semibold mb-2">Majority Wins</h3>
                <p className="text-sm text-base-content/70">
                  Majority voters split 15% of the minority&apos;s staked tokens as rewards.
                </p>
              </div>

            </div>

            <div className="divider"></div>

            <div className="bg-info/10 rounded-lg p-4">
              <h4 className="font-semibold text-info mb-2">💡 Pro Tips for Maximizing Earnings</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Stake more:</strong> Higher stakes mean higher potential rewards from winning votes</li>
                <li>• <strong>Vote accurately:</strong> Consistent correct voting builds your reputation and earnings</li>
                <li>• <strong>Vote early:</strong> Don&apos;t wait until the last minute - voting closes after 48 hours</li>
                <li>• <strong>Stay active:</strong> Regular participation in both staking and voting maximizes your $HOTDOG earnings</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Risk Warning */}
        <div className="alert alert-warning max-w-4xl">
          <ExclamationTriangleIcon className="h-6 w-6" />
          <div>
            <h3 className="font-bold">Important Risk Notice</h3>
            <div className="text-sm">
              Voting incorrectly will result in losing 15% of your staked tokens to the winning side. 
              Only vote if you&apos;re confident in your judgment. Your staked tokens remain locked during active votes.
            </div>
          </div>
        </div>

      </div>
    </main>
  );
};

export default EarnPage; 