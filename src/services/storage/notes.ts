import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Directory, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Note } from "../../types/note";

const NOTES_KEY = "@distilnotes/notes";

function noteDir(noteId: string): Directory {
  return new Directory(Paths.document, "notes", noteId);
}

export async function getNotes(): Promise<Note[]> {
  const data = await AsyncStorage.getItem(NOTES_KEY);
  const notes: Note[] = data ? JSON.parse(data) : [];
  return notes.map((n) => ({ ...n, imageUris: n.imageUris ?? [] }));
}

export async function getNote(id: string): Promise<Note | null> {
  const notes = await getNotes();
  return notes.find((n) => n.id === id) ?? null;
}

export async function saveNote(note: Note): Promise<void> {
  const notes = await getNotes();
  const index = notes.findIndex((n) => n.id === note.id);
  if (index >= 0) {
    notes[index] = note;
  } else {
    notes.unshift(note);
  }
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export async function deleteNoteData(id: string): Promise<void> {
  const notes = await getNotes();
  const filtered = notes.filter((n) => n.id !== id);
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(filtered));

  const dir = noteDir(id);
  if (dir.exists) {
    dir.delete();
  }
}

export async function persistImages(
  noteId: string,
  uris: string[]
): Promise<string[]> {
  if (uris.length === 0) return [];

  const dir = noteDir(noteId);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }

  const docPrefix = Paths.document.uri;

  const persistent: string[] = [];
  for (const uri of uris) {
    if (uri.startsWith(docPrefix)) {
      const ext = uri.split(".").pop()?.toLowerCase();
      if (ext === "heic" || ext === "heif") {
        const result = await manipulateAsync(uri, [], { format: SaveFormat.JPEG, compress: 0.85 });
        const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
        const dest = new File(dir, filename);
        const src = new File(result.uri);
        await src.copy(dest);
        persistent.push(dest.uri);
      } else {
        persistent.push(uri);
      }
      continue;
    }

    const ext = uri.split(".").pop()?.toLowerCase() || "jpg";

    if (ext === "heic" || ext === "heif") {
      const result = await manipulateAsync(uri, [], { format: SaveFormat.JPEG, compress: 0.85 });
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
      const dest = new File(dir, filename);
      const src = new File(result.uri);
      await src.copy(dest);
      persistent.push(dest.uri);
    } else {
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const dest = new File(dir, filename);
      const src = new File(uri);
      await src.copy(dest);
      persistent.push(dest.uri);
    }
  }
  return persistent;
}

export async function removeImageFile(uri: string): Promise<void> {
  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}

export async function deleteAllNotesData(): Promise<void> {
  await AsyncStorage.removeItem(NOTES_KEY);
  const notesDir = new Directory(Paths.document, "notes");
  if (notesDir.exists) {
    notesDir.delete();
  }
}
