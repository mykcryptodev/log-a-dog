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
  width?: string;
  height?: string;
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
        let objectURL;
        if (typeof window !== 'undefined') {
          objectURL = URL.createObjectURL(singleBlob);
        } else {
          return src;
        }
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

  if (isLoading) {
    return (
      <div className={`w-64 h-64 bg-base-300 rounded-lg animate-pulse ${className}`} />
    )
  }

  if (useImageComponent) {
    return (
      <div className={`w-[${width ?? '250px'}] h-[${height ?? '300px'}] relative`}>
        <Image
          src={imageSrc}
          alt={alt ?? "Image"}
          className={className}
          width={Number(width?.replace("px", "") ?? 250)}
          height={Number(height?.replace("px", "") ?? 300)}
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
      width={width}
      height={height}
      style={style}
      client={client}
    />
  )
};

export default CustomMediaRenderer;