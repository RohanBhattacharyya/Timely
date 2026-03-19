# ⌚Timely

## 🚀Blazing Fast Time Management Software

You've missed deadlines. Timely is your solution. It features a novel approach to task creation, using an Eisenhower Matrix, and an undervalued method of reminder creation: reminders through association. Timely will help guide you through the steps that you need to succeed. 

Why is it blazing fast? It's made in Tauri v2:

> "By being built on Rust, Tauri is able to take advantage of the memory, thread, and type-safety offered by Rust. Apps built on Tauri can automatically get those benefits even without needing to be developed by Rust experts" ([Tauri](https://v2.tauri.app/start/)).


## Platforms

This software should work on all platforms it has been compiled for (goal: mac, linux, windows, android, ios). Due to a current limitation in webkitgtk, future advanced features cannot be supported in Linux, however, as of the moment, it is fully supported. I recommend using Windows for this program.

The program has been tested on **Linux**, and **Android**.

## Developer Build

Dependencies are listed [here](https://v2.tauri.app/start/prerequisites/).

Run:
```deno install```
then
```deno task tauri dev```

On Linux Wayland, you may have to run it with these environment variables:

```WEBKIT_DISABLE_DMABUF_RENDERER=1 WEBKIT_DISABLE_COMPOSITING_MODE=1 deno task tauri dev```

## Android Release Signing

Create `src-tauri/gen/android/keystore.properties` with:

```properties
password=<keystore password>
keyAlias=<key alias, for example upload>
storeFile=<absolute path to your .jks file>
```

Once that file exists, running `deno task tauri android build --apk` will automatically sign the release APK. Keep both the keystore and `keystore.properties` out of source control.

If `keystore.properties` is missing, local Android builds fall back to the default debug keystore at `~/.android/debug.keystore` when it exists, which produces an installable signed APK for testing but is not appropriate for Play Store distribution.
