import exifr from 'exifr';
import { type NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useEffect,useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";

import Breadcrumbs from "~/components/utils/Breadcrumbs";
import NotificationContext from "~/context/Notification";
import withSignedInProtection from "~/hoc/withSignedInProtection";
import { type ExifData } from '~/types/imageMetadata';
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";

interface FormInput {
  amount: number;
}

export const CreateEntry: NextPage = () => {
  const { popNotification } = useContext(NotificationContext);
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const { data: contest } = api.contest.getBySlug.useQuery({ slug });
  const submitEntry = api.contest.submitEntry.useMutation();
  const [imgUrl, setImg] = useState<string>("");
  const [exifData, setExifData] = useState<ExifData | undefined>(undefined);
  const { data: reverseGeocode } = api.geocode.reverse.useQuery({
    lat: exifData?.latitude || 0,
    lng: exifData?.longitude || 0,
  });
  console.log({ reverseGeocode });
  const { register, handleSubmit } = useForm<FormInput>({
    defaultValues: {
      amount: 1,
    },
  });

  useEffect(() => {
    if (imgUrl) {
      void fetchImageAndExtractExif(imgUrl);
    }imgUrl
  }, [imgUrl]);

  const fetchImageAndExtractExif = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const exif = await exifr.parse(blob);
      
      setExifData(exif as ExifData);
    } catch (err) {
      console.error('Error while fetching image and extracting EXIF data:', err);
      setExifData(undefined);
    }
  };

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    if (!contest?.id) return;
    try {
      await submitEntry.mutateAsync({
        amount: Number(data.amount),
        contestId: contest.id,
        image: imgUrl,
      });
      popNotification({
        title: "Success",
        description: "Your entry has been created.",
        type: "success"
      });
    } catch (e) {
      console.error({ e });
      const error = e as Error;
      popNotification({
        title: "Error",
        description: "There was an error creating your entry. " + error.message,
        type: "error"
      });
    }
  };

  if (contest) {
    return (
      <div>
        <Breadcrumbs
          currentPaths={[
            `/contest/${slug}`,
            `/contest/${slug}/entry/create`
          ]}
          currentPathNames={[
            contest.name,
            "Log a Dog"
          ]}
        />
        <h1 className="text-5xl font-bold">
          Log a Dog
        </h1>
        <div className="flex justify-center w-full">
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 max-w-sm">
            <div className="flex flex-col gap-2">
              <Image
                src={imgUrl}
                alt="Uploaded Image"
                className="w-72 h-72 rounded-lg mx-auto"
                width={500}
                height={500}
              />
              <UploadButton
                endpoint="imageUploader"
                onUploadProgress={(progress) => {
                  // Do something with the progress
                  console.log("Progress: ", progress);
                }}
                onClientUploadComplete={(res) => {
                  // Do something with the response
                  console.log("Files: ", res);
                  setImg(res?.[0]?.fileUrl || "");
                }}
                onUploadError={(error: Error) => {
                  // Do something with the error.
                  alert(`ERROR! ${error.message}`);
                }}
              />
              {reverseGeocode && <p>{JSON.stringify(reverseGeocode)}</p>}
            </div>
            <div className="flex flex-col gap-4">
              <label htmlFor="amount" className="text-lg font-bold">Amount</label>
              <input
                id="amount"
                className="input input-lg input-bordered"
                type="number"
                {...register("amount")}
              />
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  return null;
};

export default withSignedInProtection(CreateEntry);