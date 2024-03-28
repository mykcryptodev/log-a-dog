import { useEffect, type FC, useState } from "react";
import { type ThirdwebClient } from "thirdweb";
import { MediaRenderer } from "thirdweb/react";
import heic2any from "heic2any";
import Image from "next/image";

type Props = {
  src: string;
  client: ThirdwebClient;
  alt?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}
export const CustomMediaRenderer: FC<Props> = ({ 
  src, 
  client, 
  alt, 
  className, 
  width, 
  height, 
  style
 }) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [useImageComponent, setUseImageComponent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const convertHeicToJpeg = async (src: string) => {
    if (src.endsWith(".heic")) {
      setIsLoading(true);
      // if it starts with ipfs, turn it into an ipfs.io link
      if (src.startsWith("ipfs://")) {
        src = src.replace("ipfs://", "https://ipfs.io/ipfs/");
      }

      try {
        const response = await fetch(src);
        const blob = await response.blob();
    
        const convertedBlob = await heic2any({
          blob,
          toType: "image/jpeg",
          quality: 0.5
        });
    
        const singleBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        if (!singleBlob) {
          throw new Error("Conversion failed, no blob was produced.");
        }
        const objectURL = URL.createObjectURL(singleBlob);
        setUseImageComponent(true);
        return objectURL;
      } catch (e) {
        console.error(e);
        return src;
      } finally {
        setIsLoading(false);
      }

    }
    return src;
  }

  useEffect(() => {
    void convertHeicToJpeg(src).then(setImageSrc);
  }, [src]);

  console.log({ src, isLoading, endWith: src.endsWith(".heic") });

  if (isLoading) {
    return (
      <div className={`w-[${width ?? '250px'}] h-[${height ?? '300px'}] bg-base-300 rounded-lg animate-pulse ${className}`} />
    )
  }

  if (useImageComponent) {
    return (
      <div className={`w-[${width ?? '250px'}] h-[${height ?? '300px'}] relative`}>
        <Image
          src={imageSrc}
          alt={alt ?? "Image"}
          className={className}
          fill
          style={style}
        />
      </div>
    )
  }
  
  return (
    <MediaRenderer
      src={imageSrc}
      alt={alt}
      className={className}
      width={width as string}
      height={height as string}
      style={style}
      client={client}
    />
  )
};

export default CustomMediaRenderer;