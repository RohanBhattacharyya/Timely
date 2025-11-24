import { BaseDirectory, exists, FileHandle, open, SeekMode } from "@tauri-apps/plugin-fs";

enum EisenhowerLoc {
  ImportantUrgent,
  ImportantNotUrgent,
  NotImportantUrgent,
  NotImportantNotUrgent
};

type Task = {
  title: string,
  priority: number,
  eisenhowerloc: EisenhowerLoc
};


let file: FileHandle;
let tasks: Task[];

function writeTasksToFile() {
  file.truncate(0);
  file.seek(0, SeekMode.Start);
  file.write(new TextEncoder().encode(JSON.stringify(tasks)));
}

function addTaskFromPrompt(){

  let name: string = prompt("Task name?") || "";
  let task: Task = {title: name, priority: 1, eisenhowerloc: EisenhowerLoc.ImportantUrgent};
  tasks.push(task);

}

function displayTasksInMatrix() {
  tasks.forEach((task)=>{
    
    document.getElementById("important-urgent")
  })
}

window.addEventListener("DOMContentLoaded", async ()=>{
  // Do the File Stuff
  let objectFileExists: boolean = await exists('timely.json', {
    baseDir: BaseDirectory.AppData
  });

  file = await open('timely.json', {
    read: true,
    write: true,
    baseDir: BaseDirectory.AppData
  });

  if (!objectFileExists) {
    writeTasksToFile();
  }

  const stat = await file.stat();
  const buf = new Uint8Array(stat.size);
  await file.read(buf);
  const textContents = new TextDecoder().decode(buf);
  tasks = JSON.parse(textContents);

  // Media Recording Things
  // let recordButton: HTMLButtonElement = document.getElementById("record-button") as HTMLButtonElement;
  // let stopRecordButton: HTMLButtonElement = document.getElementById("stop-record-button") as HTMLButtonElement;
  // // let speechToTextDiv: HTMLDivElement = document.getElementById("speech-to-text-stream") as HTMLDivElement;
  // let audioThing: HTMLAudioElement = document.getElementById("playback") as HTMLAudioElement;

  // let mediaRecorder: MediaRecorder;
  // let chunks:Blob[] = [];
  // let stream: MediaStream;

  // recordButton.addEventListener("click", async ()=>{
  //   console.log("started recording");
  //   stream = await navigator.mediaDevices.getUserMedia({audio: true});

  //   mediaRecorder = new MediaRecorder(stream);

  //   chunks = [];
  //   mediaRecorder.addEventListener("dataavailable", (d)=>{
  //     if (d.data && d.data.size !== 0) {
  //       chunks.push(d.data);
  //     }
  //   });

  //   mediaRecorder.start();

  //   recordButton.disabled = true;
  //   stopRecordButton.disabled = false;
  // });


  // stopRecordButton.addEventListener("click", ()=>{

  //   let audioBlob: Blob;

  //   mediaRecorder.addEventListener("stop", ()=>{
  //     audioBlob = new Blob(chunks, {type: mediaRecorder.mimeType ? mediaRecorder.mimeType : "audio/webm"});
  //     if (stream) {
  //       stream.getTracks().forEach((track)=>{
  //         track.stop();
  //       })
  //     }

  //     audioThing.src = URL.createObjectURL(audioBlob);
  //   }, {once: true});

  //   mediaRecorder.stop();

  //   recordButton.disabled = false;
  //   stopRecordButton.disabled = true;
  // });

  document.getElementById("add-task-button")?.addEventListener("click", ()=>{
    addTaskFromPrompt();
  });
  
});