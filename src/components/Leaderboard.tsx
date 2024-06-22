import { useContext, type FC, useState, useEffect, useMemo } from "react";
import { api } from "~/utils/api";
import ActiveChainContext from "~/contexts/ActiveChain";
import dynamic from "next/dynamic";
import { type ApexOptions } from "apexcharts";
import { resolveScheme } from "thirdweb/storage";
import { client } from "~/providers/Thirdweb";

const ReactApexChart = dynamic(
  () => import(
    "react-apexcharts"),
  { ssr: false } // This line disables server-side rendering
);

type Profile = {
  username: string;
  imgUrl: string;
  metadata: string;
  address: string;
}

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  refetchTimestamp: number;
}

export const Leaderboard: FC<Props> = ({ attestors, limit, startDate, endDate, refetchTimestamp }) => {
  const limitOrDefault = limit ?? 10;
  const { activeChain } = useContext(ActiveChainContext);

  const { data: leaderboard, refetch } = api.hotdog.getLeaderboard.useQuery({
    chainId: activeChain.id,
    ...startDate && { startDate: Math.floor(startDate.getTime() / 1000) },
    ...endDate && { endDate: Math.floor(endDate.getTime() / 1000) },
  }, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  console.log({ leaderboard });

  useEffect(() => {
    if (refetchTimestamp) {
      void refetch();
    }
  }, [refetch, refetchTimestamp]);

  const { data: profiles } = api.profile.getManyByAddress.useQuery({
    chainId: activeChain.id,
    addresses: [...(leaderboard?.users ?? [])],
  }, {
    enabled: !!leaderboard?.users,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const [userPrefersDarkMode, setUserPrefersDarkMode] = useState<boolean>(false);
  useEffect(() => {
    setUserPrefersDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const [windowWidth, setWindowWidth] = useState<number>(650);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const width = useMemo(() => {
    return windowWidth <= 640 ? 350 : 640;
  }, [windowWidth]);

  if (!leaderboard || !profiles) return (
    <div className="bg-base-200 rounded-lg animate-pulse w-[640px] h-72" />
  );

  const generateAnnotations = (profiles: Profile[], limit: number, series: number[]) => {
    return profiles.slice(0, limit).map((profile, index) => {
      const imgUrl = profile.imgUrl;
      if (!imgUrl) return;
      const resolvedImgUrl = resolveScheme({
        client,
        uri: imgUrl,
      });

      return {
        x: profile.username ?? `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`,
        y: series[index]! + 5,
        label: {
          text: '',
          style: {
            background: 'transparent',
          },
        },
        image: {
          path: resolvedImgUrl,
          width: 20,
          height: 20,
        }
      };
    });
  };

  const chartOptions = {
    options: {
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false,
        },
      },
      tooltip: {
        custom: ({ series, seriesIndex, dataPointIndex }: { series: number[][], seriesIndex: number, dataPointIndex: number }) => {
          const profile = profiles[dataPointIndex];
          if (!profile) {
            return '';
          }
          const imgUrl = profile.imgUrl;

          const resolvedImgUrl = !imgUrl ? '' : resolveScheme({
            client,
            uri: imgUrl,
          });

          if (!resolvedImgUrl) {
            return `<div>
                <p>${profile.username ? profile.username : profile.address.slice(0, 6) + '...' + profile.address.slice(-4)}</p>
                <p>${series[seriesIndex]?.[dataPointIndex]} Hotdogs Eaten</p>
              </div>
            `;
          }
  
          return `
            <div>
              <div>
                <img src="${resolvedImgUrl}" width="20" height="20" />
                <span>${profile.username ? profile.username : profile.address.slice(0, 6) + '...' + profile.address.slice(-4)}</span>
              </div>
              <p>${series[seriesIndex]?.[dataPointIndex]} Hotdogs Eaten</p>
            </div>
          `;
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: profiles.slice(0, limitOrDefault).map(profile => profile.username || `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`),
        labels: {
          style: {
            colors: userPrefersDarkMode ? '#868D9A' : undefined,
          },
        },
      },
      yaxis: {
        title: {
          text: 'Hotdogs Eaten',
          style: {
            color: userPrefersDarkMode ? '#868D9A' : undefined,
          },
        },
      },
      fill: {
        opacity: 0.75
      },
      annotations: {
        points: generateAnnotations(
          profiles, 
          limitOrDefault,
          leaderboard.hotdogs.slice(0, limitOrDefault).map((hotdog) => Number(hotdog))
        ),
      },
    },
    series: [{
      name: 'Hotdogs Eaten',
      data: leaderboard.hotdogs.slice(0, limitOrDefault).map((hotdog) => Number(hotdog)),
    }]
  };

  return (
    <ReactApexChart
      options={chartOptions.options as ApexOptions}
      series={chartOptions.series}
      type="bar"
      height={350}
      width={width}
    />
  );
};