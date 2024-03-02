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

export const Leaderboard: FC = () => {
  const { activeChain } = useContext(ActiveChainContext);
  const { data } = api.attestation.getLeaderboard.useQuery({
    chainId: activeChain.id,
    cursor: 0,
    itemsPerPage: 10,
  }, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: profiles } = api.profile.getManyByAddress.useQuery({
    chainId: activeChain.id,
    addresses: data?.leaderboard.map((leader) => leader.attester) ?? [],
  }, {
    enabled: !!data?.leaderboard,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

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
    <div className="bg-base-200 rounded-lg animate-pulse w-96 h-72" />
  );

  const chartOptions = {
    options: {
      chart: {
        type: 'bar',
        height: 350
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
        categories: profiles.map((profile) => profile.username),
      },
      yaxis: {
        title: {
          text: 'Hotdogs Eaten'
        }
      },
      fill: {
        opacity: 0.75
      },
    },
    series: [{
      name: 'Hotdogs Eaten',
      data: data.leaderboard.map((leader) => leader._count.attester)
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