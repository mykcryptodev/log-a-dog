import { useEffect, useState, type FC } from "react";
import Image from "next/image";
import { MediaRenderer } from "thirdweb/react";
import { client } from "~/providers/Thirdweb";

// Minimal blurhash decoder utilities
const digitCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,.-:;=?@[]^_{|}~";

function decode83(str: string) {
  let value = 0;
  for (const char of str) {
    const idx = digitCharacters.indexOf(char);
    value = value * 83 + idx;
  }
  return value;
}

function sRGBToLinear(value: number) {
  const v = value / 255;
  if (v <= 0.04045) return v / 12.92;
  return Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearTosRGB(value: number) {
  const v = Math.max(0, Math.min(1, value));
  if (v <= 0.0031308) return Math.trunc(v * 12.92 * 255 + 0.5);
  return Math.trunc((1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255 + 0.5);
}

function sign(val: number) {
  return val < 0 ? -1 : 1;
}

function signPow(val: number, exp: number) {
  return sign(val) * Math.pow(Math.abs(val), exp);
}

function decodeDC(value: number): [number, number, number] {
  const r = value >> 16;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return [sRGBToLinear(r), sRGBToLinear(g), sRGBToLinear(b)];
}

function decodeAC(value: number, maximumValue: number): [number, number, number] {
  const quantR = Math.floor(value / (19 * 19));
  const quantG = Math.floor(value / 19) % 19;
  const quantB = value % 19;
  return [
    signPow((quantR - 9) / 9, 2.0) * maximumValue,
    signPow((quantG - 9) / 9, 2.0) * maximumValue,
    signPow((quantB - 9) / 9, 2.0) * maximumValue,
  ];
}

function decodeBlurHash(blurhash: string, width: number, height: number, punch = 1) {
  const sizeFlag = decode83(blurhash[0]!);
  const numY = Math.floor(sizeFlag / 9) + 1;
  const numX = (sizeFlag % 9) + 1;

  const quantisedMaximumValue = decode83(blurhash[1]!);
  const maximumValue = (quantisedMaximumValue + 1) / 166;

  const colors = new Array<[number, number, number]>(numX * numY);
  for (let i = 0; i < colors.length; i++) {
    if (i === 0) {
      const value = decode83(blurhash.substring(2, 6));
      colors[i] = decodeDC(value);
    } else {
      const value = decode83(blurhash.substring(4 + i * 2, 6 + i * 2));
      colors[i] = decodeAC(value, maximumValue * punch);
    }
  }

  const bytesPerRow = width * 4;
  const pixels = new Uint8ClampedArray(bytesPerRow * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;

      for (let j = 0; j < numY; j++) {
        const basisY = Math.cos((Math.PI * y * j) / height);
        for (let i = 0; i < numX; i++) {
          const basis = Math.cos((Math.PI * x * i) / width) * basisY;
          const color = colors[i + j * numX]!;
          r += color[0] * basis;
          g += color[1] * basis;
          b += color[2] * basis;
        }
      }

      pixels[4 * x + 0 + y * bytesPerRow] = linearTosRGB(r);
      pixels[4 * x + 1 + y * bytesPerRow] = linearTosRGB(g);
      pixels[4 * x + 2 + y * bytesPerRow] = linearTosRGB(b);
      pixels[4 * x + 3 + y * bytesPerRow] = 255;
    }
  }

  return pixels;
}

function blurhashToDataURL(hash: string, width = 32, height = 32) {
  if (typeof window === "undefined") return undefined;
  const pixels = decodeBlurHash(hash, width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

type ZoraCoinLike =
  | {
      mediaContent?: {
        previewImage?: {
          medium?: string;
          blurhash?: string;
        };
      };
    }
  | string
  | null
  | undefined;

type Props = {
  src: string;
  zoraCoin?: ZoraCoinLike;
  className?: string;
  width?: string;
  height?: string;
};

export const HotdogImage: FC<Props> = ({ src, zoraCoin, className, width, height }) => {
  const coin = typeof zoraCoin === "object" && zoraCoin !== null && "mediaContent" in zoraCoin ? zoraCoin as { mediaContent?: { previewImage?: { medium?: string; blurhash?: string } } } : undefined;
  const preview = coin?.mediaContent?.previewImage?.medium;
  const blurhash = coin?.mediaContent?.previewImage?.blurhash;
  const [blurDataURL, setBlurDataURL] = useState<string>();

  useEffect(() => {
    if (blurhash) {
      const url = blurhashToDataURL(blurhash);
      if (url) setBlurDataURL(url);
    }
  }, [blurhash]);

  if (preview) {
    return (
      <Image
        src={preview}
        alt="Hotdog image"
        className={className}
        width={Number(width?.replace("px", "") ?? 250)}
        height={Number(height?.replace("px", "") ?? 300)}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
        style={{ height, width }}
      />
    );
  }

  return (
    <MediaRenderer
      src={src}
      client={client}
      className={className}
      width={width}
      height={height}
    />
  );
};

export default HotdogImage;
