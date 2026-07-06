import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Dialog,
  Input,
  Text,
  TextArea,
  TextField,
} from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, Cancel01Icon, Delete01Icon, ImageAdd01Icon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as notesService from "../../services/notesService";
import { Note } from "../../types/note";

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [saved, setSaved] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    notesService.getNoteById(id).then((n) => {
      if (n) {
        setNote(n);
        setTitle(n.title);
        setContent(n.content);
        setImageUris(n.imageUris);
        isInitialLoad.current = false;
      }
    });
  }, [id]);

  useEffect(() => {
    if (!note || isInitialLoad.current) return;
    const timer = setTimeout(() => {
      notesService.updateNote(id, { title, content, imageUris });
      setSaved(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [id, note, title, content, imageUris]);

  const handleChangeTitle = useCallback((text: string) => {
    setTitle(text);
    setSaved(false);
  }, []);

  const handleChangeContent = useCallback((text: string) => {
    setContent(text);
    setSaved(false);
  }, []);

  async function handlePickImages() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setImageUris((prev) => [...prev, ...newUris]);
      setSaved(false);
    }
  }

  function handleRemoveImage(uri: string) {
    setImageUris((prev) => prev.filter((u) => u !== uri));
    setSaved(false);
  }

  async function handleDelete() {
    await notesService.deleteNote(id);
    setDeleteDialogOpen(false);
    router.back();
  }

  if (!note) return null;

  return (
    <View className="flex-1 bg-background pt-safe">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          <Text className="ml-1">Notes</Text>
        </Button>
        <View className="flex-row items-center gap-3">
          <Text
            className={`text-xs font-medium ${
              saved ? "text-success" : "text-muted"
            }`}
          >
            {saved ? "Saved" : "Unsaving..."}
          </Text>
          <Button
            variant="danger-soft"
            size="sm"
            onPress={() => setDeleteDialogOpen(true)}
          >
            <HugeiconsIcon icon={Delete01Icon} size={16} />
            <Text className="ml-1">Delete</Text>
          </Button>
        </View>
      </View>

      <View className="px-4 pt-2">
        <TextField>
          <Input
            placeholder="Note title"
            value={title}
            onChangeText={handleChangeTitle}
            className="text-2xl font-bold"
          />
        </TextField>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <TextField>
          <TextArea
            placeholder="Start writing..."
            value={content}
            onChangeText={handleChangeContent}
            className="text-base leading-relaxed min-h-[200]"
          />
        </TextField>

        {imageUris.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
          >
            <View className="flex-row gap-3">
              {imageUris.map((uri) => (
                <View key={uri} className="relative">
                  <Image
                    source={{ uri }}
                    className="size-24 rounded-xl bg-surface"
                  />
                  <Pressable
                    onPress={() => handleRemoveImage(uri)}
                    className="absolute -top-2 -right-2 size-6 rounded-full bg-danger items-center justify-center"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-danger-foreground" />
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <Button
          variant="ghost"
          size="sm"
          onPress={handlePickImages}
          className="mt-4 self-start"
        >
          <HugeiconsIcon icon={ImageAdd01Icon} size={16} />
          <Text className="ml-1">Add Image</Text>
        </Button>

        <View className="h-8" />
      </ScrollView>

      <View className="pb-safe" />

      <Dialog isOpen={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close variant="ghost" />
            <View className="mb-5 gap-1.5">
              <Dialog.Title>Delete Note</Dialog.Title>
              <Dialog.Description>
                Are you sure you want to delete &quot;{note.title || "Untitled"}
                &quot;? This action cannot be undone.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="danger" size="sm" onPress={handleDelete}>
                Delete
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}
