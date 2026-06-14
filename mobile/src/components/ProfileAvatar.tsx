import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { convertIpfsToHttps } from "~/utils/format";

interface Props {
  image?: string | null;
  address?: string;
  size?: number;
}

function addressToColor(address: string): string {
  const colors = [
    "#E23B2E", "#F5C518", "#5BA84A", "#7FB7D9", "#9B59B6",
    "#E67E22", "#1ABC9C", "#E91E63",
  ];
  const idx =
    address
      .toLowerCase()
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx]!;
}

export function ProfileAvatar({ image, address = "", size = 36 }: Props) {
  const httpsImage = useMemo(() => convertIpfsToHttps(image), [image]);
  const bgColor = useMemo(() => addressToColor(address), [address]);
  const initials = address ? address.slice(2, 4).toUpperCase() : "??";

  if (httpsImage) {
    return (
      <Image
        source={{ uri: httpsImage }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontWeight: "700",
          fontSize: size * 0.35,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
