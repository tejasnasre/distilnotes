import { ExecuTorchEmbeddings } from "@react-native-rag/executorch";
import { OPSQLiteVectorStore } from "@react-native-rag/op-sqlite";
import { CLIP_VIT_BASE_PATCH32_TEXT, CLIP_VIT_BASE_PATCH32_IMAGE, ImageEmbeddingsModule } from "react-native-executorch";

let _imageEmbeddings: ImageEmbeddingsModule | undefined;
let _initPromise: Promise<void> | null = null;

export const imageVectorStore = new OPSQLiteVectorStore({
  name: "notes_image_vector_store",
  embeddings: new ExecuTorchEmbeddings(CLIP_VIT_BASE_PATCH32_TEXT),
});

export function initializeImageEmbeddings(): Promise<void> {
  if (_initPromise) return _initPromise;
  _initPromise = ImageEmbeddingsModule.fromModelName(CLIP_VIT_BASE_PATCH32_IMAGE).then(
    (module) => { _imageEmbeddings = module; },
    (e) => { console.error("Failed to load image embeddings model", e); }
  );
  return _initPromise;
}

export function getImageEmbeddings(): ImageEmbeddingsModule | undefined {
  return _imageEmbeddings;
}
