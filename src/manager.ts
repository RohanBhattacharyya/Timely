// A "static"-like file that holds all the current timely information.
import { FileHandle } from "@tauri-apps/plugin-fs";
import { Day, Task, writeTimelyFile } from "./timely";

let file: FileHandle;
let tasks: Task[] = [];
let userAPIKey: string = "";
let currentlyClassifyingCount: number = 0;
let schedule: Day[] = [];

export function getFile(): FileHandle {
  return file;
}

export function setFile(newFile: FileHandle): void {

  file = newFile;
}

export function getTasks(): Task[] {
  return tasks;
}

export async function setTasks(newTasks: Task[]): Promise<void> {
  tasks = newTasks;
  await writeTimelyFile();
}

export function getUserAPIKey(): string {
  return userAPIKey;
}

export async function setUserAPIKey(newKey: string): Promise<void> {
  userAPIKey = newKey;
  await writeTimelyFile();
}

export function getCurrentlyClassifyingCount(): number {
  return currentlyClassifyingCount;
}

export function setCurrentlyClassifyingCount(newCount: number): void {
  currentlyClassifyingCount = newCount;
}

export function incrementCurrentlyClassifyingCount(): void {
  currentlyClassifyingCount++;
}

export function decrementCurrentlyClassifyingCount(): void {
  currentlyClassifyingCount--;
}

export function getSchedule(): Day[] {
  return schedule;
}

export async function setSchedule(newSchedule: Day[]): Promise<void> {
  schedule = newSchedule;
  await writeTimelyFile();
}