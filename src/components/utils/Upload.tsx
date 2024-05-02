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
  } : { 
    resolvedUrls: string[], uris: string[]
  }) => void;
  onUploadError?: (error: Error) => void;
  initialUrls?: string[];
  height?: string;
  objectCover?: boolean;
  imageClassName?: string;
}

export const Upload: FC<UploadProps> = ({ 
  className, 
  label, 
  hoverLabel, 
  onUpload,
  onUploadError,
  additionalClasses,
  initialUrls,
  height,
  objectCover,
  imageClassName,
}) => {
  const [urls, setUrls] = useState<string[]>([]);
  const [preparingUpload, setPreparingUpload] = useState<boolean>(false);

  useEffect(() => {
    if (initialUrls && initialUrls.length > 0) {
      setUrls(initialUrls);
    }
  }, [initialUrls]);

  const resizeImageFile = async (file: File): Promise<File> => {
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size <= maxSize) return file; // Return original file if it doesn't exceed the limit

    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const src = URL.createObjectURL(file);
    img.src = src;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    let quality = 0.9; // Start with high quality
    let resizedFile = file;

    do {
      const ctx = canvas.getContext('2d');
      const width = img.width * quality;
      const height = img.height * quality;
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      const blob = await new Promise<Blob>((resolve, reject) => 
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/jpeg', quality)
      );
      resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
      quality -= 0.1; // Reduce quality progressively
    } while (resizedFile.size > maxSize && quality > 0.1);

    URL.revokeObjectURL(src);
    return resizedFile;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUrls([]);
    setPreparingUpload(true);

    const resizedFilesPromises = acceptedFiles.map(async (file) => {
      return await resizeImageFile(file);
    });

    const resizedFiles = await Promise.all(resizedFilesPromises);

    try {
      const uris = await upload({
        files: resizedFiles,
        client,
      });
      const resolvedUrls = typeof uris === 'string' ? [resolveScheme({
        uri: uris,
        client,
      })] : await Promise.all(uris.map(uri => (
        resolveScheme({
          uri,
          client,
        })
      )));
      setPreparingUpload(false);
      setUrls(resolvedUrls);
      onUpload?.({ resolvedUrls, uris: typeof uris === 'string' ? [uris] : uris });
    } catch (e) {
      toast("Error uploading file", { type: "error" });
      onUploadError?.(e as Error);
    }
  }, [onUpload, onUploadError]);
  
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { image: ["image/*"] }});

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
              className={imageClassName}
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