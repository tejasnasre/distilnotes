import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { Text } from "heroui-native";
import { initExecutorch } from "react-native-executorch";
import { ExpoResourceFetcher } from "react-native-executorch-expo-resource-fetcher";
import { textVectorStore } from "../services/vectorStores/textVectorStore";
import { imageVectorStore, initializeImageEmbeddings } from "../services/vectorStores/imageVectorStore";

export default function Index() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        initExecutorch({ resourceFetcher: ExpoResourceFetcher });
        await textVectorStore.load();
        await imageVectorStore.load();
        setIsLoaded(true);
        initializeImageEmbeddings();
      } catch (e) {
        console.error("Vector stores failed to load", e);
        setIsLoaded(true);
      }
    })();
  }, []);

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background gap-3">
        <ActivityIndicator size="large" />
        <Text className="text-muted text-sm">Loading AI model...</Text>
      </View>
    );
  }

  return <Redirect href={"/notes" as any} />;
}
