# ⌚Timely

## 🚀Blazing Fast Time Management Software

You've missed deadlines. Timely is your solution. It features a novel approach to task creation, using an Eisenhower Matrix, and an undervalued method of reminder creation: reminders through association. Timely will help guide you through the steps that you need to succeed. 

Why is it blazing fast? It's made in Tauri v2:

> "By being built on Rust, Tauri is able to take advantage of the memory, thread, and type-safety offered by Rust. Apps built on Tauri can automatically get those benefits even without needing to be developed by Rust experts" ([Tauri](https://v2.tauri.app/start/)).


## Platforms

Theoretically, this software should work on all platforms it has been compiled for (goal: mac, linux, windows, android, ios), however, due to a current limitation in webkitgtk, Linux cannot be supported fully. I recommend using Windows for this program. 

## Developer Build

Dependencies are listed [here](https://v2.tauri.app/start/prerequisites/).

Run:
```deno install```
then
```deno task run tauri dev```

On Linux Wayland, you may have to run it with these environment variables:

```WEBKIT_DISABLE_DMABUF_RENDERER=1 WEBKIT_DISABLE_COMPOSITING_MODE=1 deno task tauri dev```
