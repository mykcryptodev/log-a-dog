import { upload, resolveScheme } from "thirdweb/storage";
import { type FC, useCallback ,useEffect, useState, useRef } from "react";
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import Image from "next/image";
import { client } from "~/providers/Thirdweb";
import heic2any from "heic2any";
import { api } from "~/utils/api";
import { DEFAULT_UPLOAD_PHRASE } from "~/constants";

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
  onUpload,
  onUploadError,
  additionalClasses,
  initialUrls,
  height,
  objectCover,
  imageClassName,
  label,
}) => {
  const [urls, setUrls] = useState<string[]>([]);
  const [dropzoneLabel, setDropzoneLabel] = useState<string>(label ?? DEFAULT_UPLOAD_PHRASE);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const safetyCheck = api.hotdog.checkForSafety.useMutation();

  // Local object-URL preview so the image shows up the instant it's picked,
  // instead of after resize + safety check + IPFS upload + gateway fetch.
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const localPreviewRef = useRef<string | null>(null);

  const showLocalPreview = useCallback((file: File) => {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    const objectUrl = URL.createObjectURL(file);
    localPreviewRef.current = objectUrl;
    setLocalPreview(objectUrl);
  }, []);

  const clearLocalPreview = useCallback(() => {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    localPreviewRef.current = null;
    setLocalPreview(null);
  }, []);

  useEffect(() => () => {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
  }, []);

  // Prevent re-renders when parent passes a new array reference
  const prevInitialUrlsRef = useRef<string>();
  useEffect(() => {
    const joined = initialUrls?.join('|');
    if (prevInitialUrlsRef.current !== joined) {
      prevInitialUrlsRef.current = joined;
      if (initialUrls && initialUrls.length > 0) {
        // Keep any local preview: the parent is usually just echoing back the
        // URL we just uploaded, and the local blob renders with no network.
        setUrls(initialUrls);
      } else {
        // Parent cleared the field — drop the local preview too.
        setUrls([]);
        clearLocalPreview();
      }
    }
  }, [clearLocalPreview, initialUrls]);

  const conductImageSafetyCheck = useCallback(async (file: File): Promise<boolean> => {
    // convert the file to base64 image
    const reader = new FileReader();
    reader.readAsDataURL(file);
    const base64Image = await new Promise<string>((resolve) => {
      reader.onload = () => {
        resolve(reader.result as string);
      };
    });
    const isSafe = await safetyCheck.mutateAsync({
      base64ImageString: base64Image,
    });
    return isSafe;
  }, [safetyCheck]);

  const resizeImageFile = useCallback(async (file: File): Promise<File> => {
    if (typeof window === 'undefined') {
      throw new Error("This function can only be run in the browser");
    }
  
    const maxSize = 0.5 * 1024 * 1024; // .5MB in bytes
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif';
  
    let imageFile = file;
  
    if (isHeic) {
      const heicBlob = await heic2any({ blob: file, toType: "image/jpeg" });
      const heicBlobArray = Array.isArray(heicBlob) ? heicBlob : [heicBlob];
      imageFile = new File(heicBlobArray, file.name.replace(/\.(heic|heif)$/, ".jpg"), { type: "image/jpeg" });
    }
  
    if (imageFile.size <= maxSize) return imageFile; // Return original file if it doesn't exceed the limit
  
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const src = URL.createObjectURL(imageFile);
    img.src = src;
  
    await new Promise((resolve) => {
      img.onload = resolve;
    });
  
    let quality = 0.9; // Start with high quality
    let resizedFile = imageFile;
  
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
      resizedFile = new File([blob], imageFile.name, { type: 'image/jpeg' });
      quality -= 0.1; // Reduce quality progressively
    } while (resizedFile.size > maxSize && quality > 0.1);
  
    URL.revokeObjectURL(src);

    return resizedFile;
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUrls([]);
    setUploadError(null);
    setDropzoneLabel("🖼️ Preparing upload...");

    // Show the picked file right away — everything below is slow and serial.
    if (acceptedFiles[0]) showLocalPreview(acceptedFiles[0]);

    // Resize / HEIC-convert. This was previously unguarded, so a conversion
    // failure became an unhandled rejection with no user-visible message.
    let resizedFiles: File[];
    try {
      resizedFiles = await Promise.all(
        acceptedFiles.map((file) => resizeImageFile(file)),
      );
    } catch (e) {
      const err = e as Error;
      console.error("Error preparing image:", err);
      toast.error("Couldn't process that image. Try a JPG or PNG.");
      setUploadError(`Couldn't process that image: ${err.message}`);
      onUploadError?.(err);
      clearLocalPreview();
      setDropzoneLabel(label ?? DEFAULT_UPLOAD_PHRASE);
      return;
    }

    if (resizedFiles.length === 0) {
      toast.error("No files to upload");
      setUploadError("No files to upload");
      onUploadError?.(new Error("No files to upload"));
      clearLocalPreview();
      setDropzoneLabel(label ?? DEFAULT_UPLOAD_PHRASE);
      return;
    }

    // Browsers can't render HEIC, so re-point the preview at the converted file.
    if (resizedFiles[0]) showLocalPreview(resizedFiles[0]);

    // Check if the image is safe
    setDropzoneLabel("🕵🏻‍♂️ Checking for safety...");
    try {
      const isSafe = await conductImageSafetyCheck(resizedFiles[0]!);
      if (!isSafe) {
        toast.error("Image is not safe to upload");
        setUploadError("That image didn't pass the safety check.");
        onUploadError?.(new Error("Image is not safe to upload"));
        clearLocalPreview();
        setDropzoneLabel(label ?? DEFAULT_UPLOAD_PHRASE);
        return;
      }
      setDropzoneLabel("✅ Image passed safety check!");
    } catch (e) {
      const err = e as Error;
      console.error("Error checking image safety:", err);
      toast.error("Error checking image safety");
      setUploadError(`Safety check failed: ${err.message}`);
      onUploadError?.(err);
      clearLocalPreview();
      setDropzoneLabel(label ?? DEFAULT_UPLOAD_PHRASE);
      return;
    }

    try {
      setDropzoneLabel("☁️ Uploading...");
      // Rename files to "image" before uploading
      const renamedFiles = resizedFiles.map((file, index) => {
        const extension = file.name.split('.').pop() ?? 'jpg';
        const newName = resizedFiles.length > 1 ? `image_${index + 1}.${extension}` : `image.${extension}`;
        return new File([file], newName, { type: file.type });
      });
      
      const uris = await upload({
        files: renamedFiles,
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
      setUrls(resolvedUrls);
      onUpload?.({ resolvedUrls, uris: typeof uris === 'string' ? [uris] : uris });
    } catch (e) {
      const err = e as Error;
      console.error("Error uploading file:", err);
      toast("Error uploading file", { type: "error" });
      setUploadError(`Upload failed: ${err.message}`);
      onUploadError?.(err);
      clearLocalPreview();
    } finally {
      setDropzoneLabel(label ?? DEFAULT_UPLOAD_PHRASE);
    }
  }, [clearLocalPreview, conductImageSafetyCheck, label, onUpload, onUploadError, resizeImageFile, showLocalPreview]);
  
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { image: ["image/*"] }});

  useEffect(() => {
    if (isDragActive) {
      setDropzoneLabel("👋 Drop here!");
    } else {
      setDropzoneLabel(label ?? DEFAULT_UPLOAD_PHRASE);
    }
  }, [isDragActive, label]);


  const previewImageSrc = (src: string) => {
    if (src.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${src.replace("ipfs://", "")}`;
    }
    return src;
  }

  const remoteUrl = urls.length > 0 && urls[0] !== "" ? urls[0] : null;
  // Local blob wins: it's already decoded, so it paints immediately and never
  // waits on the IPFS gateway.
  const previewSrc = localPreview ?? (remoteUrl ? previewImageSrc(remoteUrl) : null);
  const isWorking = localPreview !== null && remoteUrl === null;

  return (
    <div {...getRootProps()} className={className ?? `bg-base-200 rounded-lg ${height ? height : 'h-64'} w-full grid place-content-center cursor-pointer relative ${additionalClasses ?? ""}`}>
      <input {...getInputProps()} />
      {
        previewSrc ? (
          <div className="absolute inset-0 w-full h-full bg-cover overflow-hidden rounded-lg">
            <Image
              src={previewSrc}
              alt="uploaded image"
              fill
              unoptimized={localPreview !== null}
              style={{ objectFit: objectCover ? "cover" : "contain" }}
              className={imageClassName}
            />
            {isWorking && (
              <p className="absolute inset-x-0 bottom-0 bg-base-100/80 px-2 py-1 text-center text-xs">
                {dropzoneLabel}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 px-4 text-center">
            <p>{dropzoneLabel}</p>
            {uploadError && (
              <p className="text-error text-xs">{uploadError}</p>
            )}
          </div>
        )
      }
    </div>
  )
};

export default Upload;