import { Note } from "../types/note";
import * as storage from "./storage/notes";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export async function createNote(title?: string, content?: string): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: generateId(),
    title: title ?? "",
    content: content ?? "",
    createdAt: now,
    updatedAt: now,
  };
  await storage.saveNote(note);
  return note;
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, "title" | "content">>
): Promise<Note | null> {
  const note = await storage.getNote(id);
  if (!note) return null;
  const updated: Note = {
    ...note,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await storage.saveNote(updated);
  return updated;
}

export async function deleteNote(id: string): Promise<void> {
  await storage.deleteNote(id);
}

export async function getAllNotes(): Promise<Note[]> {
  return storage.getNotes();
}

export async function getNoteById(id: string): Promise<Note | null> {
  return storage.getNote(id);
}
