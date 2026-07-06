import { Note } from "../types/note";
import * as storage from "./storage/notes";
import {
  textSplitter,
  noteToString,
  textVectorStore,
} from "./vectorStores/textVectorStore";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export async function createNote(
  title?: string,
  content?: string,
  imageUris?: string[]
): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: generateId(),
    title: title ?? "",
    content: content ?? "",
    imageUris: imageUris ?? [],
    createdAt: now,
    updatedAt: now,
  };

  note.imageUris = await storage.persistImages(note.id, note.imageUris);
  await storage.saveNote(note);

  try {
    const chunks = await textSplitter.splitText(noteToString(note));
    for (const chunk of chunks) {
      await textVectorStore.add({
        document: chunk,
        metadata: { noteId: note.id },
      });
    }
  } catch (e) {
    console.error("Failed to index note", e);
  }

  return note;
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, "title" | "content" | "imageUris">>
): Promise<Note | null> {
  const note = await storage.getNote(id);
  if (!note) return null;

  const oldImages = note.imageUris;

  const updated: Note = {
    ...note,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.imageUris) {
    updated.imageUris = await storage.persistImages(id, updates.imageUris);
  }

  await storage.saveNote(updated);

  const removed = oldImages.filter((u) => !updated.imageUris.includes(u));
  for (const uri of removed) {
    await storage.removeImageFile(uri);
  }

  try {
    await textVectorStore.delete({
      predicate: (r) => r.metadata?.noteId === id,
    });
    const chunks = await textSplitter.splitText(noteToString(updated));
    for (const chunk of chunks) {
      await textVectorStore.add({
        document: chunk,
        metadata: { noteId: id },
      });
    }
  } catch (e) {
    console.error("Failed to re-index note", e);
  }

  return updated;
}

export async function deleteNote(id: string): Promise<void> {
  await storage.deleteNoteData(id);

  try {
    await textVectorStore.delete({
      predicate: (r) => r.metadata?.noteId === id,
    });
  } catch (e) {
    console.error("Failed to remove note from vector store", e);
  }
}

export async function getAllNotes(): Promise<Note[]> {
  return storage.getNotes();
}

export async function getNoteById(id: string): Promise<Note | null> {
  return storage.getNote(id);
}

export async function searchByText(
  query: string,
  notes: Note[],
  n: number = 10
): Promise<Note[]> {
  try {
    const results = await textVectorStore.query({ queryText: query });
    const noteIdToMaxSimilarity = new Map<string, number>();
    for (const r of results) {
      const noteId = r.metadata?.noteId as string | undefined;
      if (noteId) {
        const current = noteIdToMaxSimilarity.get(noteId) ?? -Infinity;
        noteIdToMaxSimilarity.set(noteId, Math.max(current, r.similarity));
      }
    }
    return notes
      .filter((n) => noteIdToMaxSimilarity.has(n.id))
      .sort((a, b) => {
        const simA = noteIdToMaxSimilarity.get(a.id) ?? 0;
        const simB = noteIdToMaxSimilarity.get(b.id) ?? 0;
        return simB - simA;
      })
      .slice(0, n);
  } catch (e) {
    console.error("Semantic search failed", e);
    return [];
  }
}
