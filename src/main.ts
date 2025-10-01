window.addEventListener("DOMContentLoaded", ()=>{

  let recordButton: HTMLButtonElement = document.getElementById("record-button") as HTMLButtonElement;
  let stopRecordButton: HTMLButtonElement = document.getElementById("stop-record-button") as HTMLButtonElement;
  // let speechToTextDiv: HTMLDivElement = document.getElementById("speech-to-text-stream") as HTMLDivElement;
  let audioThing: HTMLAudioElement = document.getElementById("playback") as HTMLAudioElement;

  let mediaRecorder: MediaRecorder;
  let chunks:Blob[] = [];
  let stream: MediaStream;

  recordButton.addEventListener("click", async ()=>{
    console.log("started recording");
    stream = await navigator.mediaDevices.getUserMedia({audio: true});

    mediaRecorder = new MediaRecorder(stream);

    chunks = [];
    mediaRecorder.addEventListener("dataavailable", (d)=>{
      if (d.data && d.data.size !== 0) {
        chunks.push(d.data);
      }
    });

    mediaRecorder.start();

    recordButton.disabled = true;
    stopRecordButton.disabled = false;
  });


  stopRecordButton.addEventListener("click", ()=>{

    let audioBlob: Blob;

    mediaRecorder.addEventListener("stop", ()=>{
      audioBlob = new Blob(chunks, {type: mediaRecorder.mimeType ? mediaRecorder.mimeType : "audio/webm"});
      if (stream) {
        stream.getTracks().forEach((track)=>{
          track.stop();
        })
      }

      audioThing.src = URL.createObjectURL(audioBlob);
    }, {once: true});

    mediaRecorder.stop();

    recordButton.disabled = false;
    stopRecordButton.disabled = true;
  });

});