import React, { useEffect, useMemo, useState } from "react";
import { Text, View, type StyleProp, type ImageStyle } from "react-native";
import { Image, type ImageContentFit } from "expo-image";
import { COLORS } from "~/constants/colors";
import { getHotdogImageCandidates } from "~/utils/hotdogImage";

interface Props {
  preview?: string | null;
  rawImageUri?: string | null;
  blurhash?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
}

export function HotdogImage({
  preview,
  rawImageUri,
  blurhash,
  style,
  contentFit = "cover",
}: Props) {
  const candidates = useMemo(
    () => getHotdogImageCandidates(preview, rawImageUri),
    [preview, rawImageUri],
  );
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [preview, rawImageUri]);

  const uri = candidates[candidateIndex];

  if (!uri) {
    return (
      <View
        style={[
          { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.base300 },
          style,
        ]}
      >
        <Text className="text-5xl">🌭</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[{ flex: 1 }, style]}
      contentFit={contentFit}
      transition={300}
      placeholder={blurhash ?? undefined}
      onError={() => {
        setCandidateIndex((current) =>
          current + 1 < candidates.length ? current + 1 : current,
        );
      }}
    />
  );
}
