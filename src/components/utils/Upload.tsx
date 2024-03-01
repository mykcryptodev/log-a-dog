import { upload, resolveScheme } from "thirdweb/storage";
import { type FC, useCallback ,useEffect,useMemo, useState } from "react";
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import Image from "next/image";
import { client } from "~/providers/Thirdweb";

interface UploadProps {
  className?: string; // completely override classes
  additionalClasses?: string; // add classes to the default classes
  label?: string;
  hoverLabel?: string;
  onUpload?: ({
    resolvedUrls,
    uris,
  }: { resolvedUrls: string[], uris: string[]
  }) => void;
  initialUrls?: string[];
  height?: string;
  objectCover?: boolean;
}

export const Upload: FC<UploadProps> = ({ 
  className, 
  label, 
  hoverLabel, 
  onUpload,
  additionalClasses,
  initialUrls,
  height,
  objectCover,
}) => {
  const [urls, setUrls] = useState<string[]>([]);
  const [preparingUpload, setPreparingUpload] = useState<boolean>(false);

  useEffect(() => {
    if (initialUrls && initialUrls.length > 0) {
      setUrls(initialUrls);
      // onUpload?.(initialUrls);
    }
  }, [onUpload, initialUrls]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // clear the urls from state
    setUrls([]);
    setPreparingUpload(true);
    // Perform file size validation
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      console.warn("File size exceeds 5MB limit:", oversizedFiles);
      toast("File size exceeds 5MB limit", { type: "error" });
      setPreparingUpload(false);
      // You can show an error message or handle the oversized files in a desired way
      return;
    }

    try {
      const uris = await upload({
        files: acceptedFiles,
        client,
      });
      const resolvedUrls = await Promise.all(uris.map(uri => (
        resolveScheme({
          uri,
          client,
        })
      )));
      setPreparingUpload(false);
      setUrls(resolvedUrls);
      onUpload?.({ resolvedUrls, uris });
    } catch (e) {
      // toast error
      toast("Error uploading file", { type: "error" });
    }
  }, [onUpload]);
  
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { image: ["image/*"], video: ["video/*"] }});

  const currentLabel = useMemo(() => {
    if (preparingUpload) {
      return "Preparing upload...";
    }
    if (isDragActive) {
      return hoverLabel ?? 'Drop here!';
    }
    return label ?? 'Drag and drop here, or click to select';
  }, [hoverLabel, isDragActive, label, preparingUpload]);


  return (
    <div {...getRootProps()} className={className ?? `bg-base-200 rounded-lg ${height ? height : 'h-64'} w-full grid place-content-center cursor-pointer relative ${additionalClasses ?? ""}`}>
      <input {...getInputProps()} />
      {
        urls.length && urls.length > 0 && urls[0] !== "" ? (
          <div className="absolute inset-0 w-full h-full bg-cover overflow-hidden rounded-lg">
            <Image
              src={urls[0]!}
              alt="uploaded image"
              layout="fill"
              objectFit={objectCover ? "cover" : "contain"}
            />
          </div>
        ) : (
          <p>{currentLabel}</p>
        )
      }
    </div>
  )
};

export default Upload;