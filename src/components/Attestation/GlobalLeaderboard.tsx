import { useContext, type FC, useState, useEffect, useMemo } from "react";
import { api } from "~/utils/api";
import ActiveChainContext from "~/contexts/ActiveChain";
import dynamic from "next/dynamic";
import { type ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(
  () => import(
    "react-apexcharts"),
  { ssr: false } // This line disables server-side rendering
);

type Props = {
  attestors?: string[];
  startDate?: Date;
  endDate?: Date;
  refetchTimestamp: number;
}

export const GlobalLeaderboard: FC<Props> = ({ refetchTimestamp }) => {
  const { activeChain } = useContext(ActiveChainContext);
  const { data, refetch, error } = api.attestation.getGlobalLeaderboard.useQuery({
    chainId: activeChain.id,
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).getTime(),
    endDate: new Date(new Date().setDate(new Date().getDate() - 25)).getTime(),
  }, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  console.log({ error, data });


  useEffect(() => {
    if (refetchTimestamp) {
      void refetch();
    }
  }, [refetch, refetchTimestamp]);

  const { data: profiles } = api.profile.getManyByAddress.useQuery({
    chainId: activeChain.id,
    addresses: data?.result?.map((leader) => leader.recipient) ?? [],
  }, {
    enabled: !!data,
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

  if (!data || !profiles) return (
    <div className="bg-base-200 rounded-lg animate-pulse w-[640px] h-72" />
  );

  const chartOptions = {
    options: {
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false,
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
        categories: profiles.map(profile => profile.username || `${profile.address.slice(0, 6)}...${profile.address.slice(-4)}`),
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
    },
    series: [{
      name: 'Hotdogs Eaten',
      data: data?.result.map((leader) => leader.PositiveAttestationCount)
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