import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image, Pressable, View, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, Text, TextField, Input } from "heroui-native";
import { Note } from "../types/note";
import * as notesService from "../services/notesService";

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadNotes = useCallback(async () => {
    const allNotes = await notesService.getAllNotes();
    setNotes(allNotes);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes])
  );

  useEffect(() => {
    if (!search.trim()) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const semantic = await notesService.searchByText(search, notes);
      if (semantic.length > 0) {
        setSearchResults(semantic);
      } else {
        const q = search.toLowerCase();
        const filtered = notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        );
        setSearchResults(filtered);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, notes]);

  const displayedNotes = useMemo(() => {
    if (!search.trim()) {
      return [...notes].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
    return searchResults ?? [];
  }, [notes, search, searchResults]);

  const isSearching = search.trim().length > 0;

  async function handleRefresh() {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }

  async function handleCreate() {
    const note = await notesService.createNote();
    router.push(`/note/${note.id}` as any);
  }

  return (
    <View className="flex-1 bg-background pt-safe">
      <View className="flex-row items-center justify-between px-5 pt-4 pb-1">
        <View>
          <Text className="text-3xl font-bold text-foreground">Notes</Text>
          <Text className="text-sm text-muted mt-0.5">
            {isSearching
              ? `${displayedNotes.length} result${displayedNotes.length === 1 ? "" : "s"}`
              : `${notes.length} ${notes.length === 1 ? "note" : "notes"}`}
          </Text>
        </View>
      </View>

      <View className="px-5 pb-3 pt-2">
        <TextField>
          <Input
            placeholder="Search notes..."
            value={search}
            onChangeText={setSearch}
            className="bg-surface"
          />
        </TextField>
      </View>

      <FlatList
        data={displayedNotes}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-24 gap-3"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center pt-20">
            <Text className="text-5xl mb-4">
              {search ? "🔍" : "📝"}
            </Text>
            <Text className="text-lg text-muted font-semibold">
              {search ? "No matching notes" : "No notes yet"}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {search
                ? "Try a different search term"
                : "Tap + to create your first note"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/note/${item.id}` as any)}
          >
            <Card className="active:opacity-80">
              <Card.Body>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Card.Title
                      numberOfLines={1}
                      className={!item.title ? "italic text-muted" : ""}
                    >
                      {item.title || "Untitled"}
                    </Card.Title>
                    <Card.Description numberOfLines={2} className="mt-1">
                      {item.content || "No content"}
                    </Card.Description>
                    <Card.Description className="text-xs mt-2 text-muted">
                      {formatRelativeDate(item.updatedAt)}
                    </Card.Description>
                  </View>
                  {item.imageUris && item.imageUris.length > 0 && (
                    <Image
                      source={{ uri: item.imageUris[0] }}
                      className="size-16 rounded-lg bg-surface"
                    />
                  )}
                </View>
              </Card.Body>
            </Card>
          </Pressable>
        )}
      />

      <Button
        variant="primary"
        className="absolute bottom-safe-or-8 right-6 rounded-full size-14 shadow-lg"
        isIconOnly
        onPress={handleCreate}
      >
        <Text className="text-accent-foreground text-2xl leading-none">+</Text>
      </Button>
    </View>
  );
}
