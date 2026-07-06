import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Dialog,
  Input,
  Text,
  TextArea,
  TextField,
} from "heroui-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import * as notesService from "../../services/notesService";
import { Note } from "../../types/note";

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    notesService.getNoteById(id).then((n) => {
      if (n) {
        setNote(n);
        setTitle(n.title);
        setContent(n.content);
        isInitialLoad.current = false;
      }
    });
  }, [id]);

  useEffect(() => {
    if (!note || isInitialLoad.current) return;
    const timer = setTimeout(() => {
      notesService.updateNote(id, { title, content });
      setSaved(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [id, note, title, content]);

  const handleChangeTitle = useCallback((text: string) => {
    setTitle(text);
    setSaved(false);
  }, []);

  const handleChangeContent = useCallback((text: string) => {
    setContent(text);
    setSaved(false);
  }, []);

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
          ← Notes
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
            Delete
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

      <View className="flex-1 px-4 pt-4">
        <TextField className="flex-1">
          <TextArea
            placeholder="Start writing..."
            value={content}
            onChangeText={handleChangeContent}
            className="flex-1 text-base leading-relaxed min-h-[300]"
          />
        </TextField>
      </View>

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
