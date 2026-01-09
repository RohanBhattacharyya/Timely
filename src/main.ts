import { addTaskFromModal, displayTasksInMatrix, init } from "./timely";
import { getUserAPIKey, setUserAPIKey } from "./manager";


window.addEventListener("DOMContentLoaded", async ()=>{
  await init();
  let apiKeyInput: HTMLInputElement = document.getElementById("api-key-input") as HTMLInputElement;
  apiKeyInput.value = getUserAPIKey();

  // console.dir(tasks, {depth: null});
  displayTasksInMatrix();

  document.getElementById("add-task-button")?.addEventListener("click", ()=>{
    addTaskFromModal();
    let modal = document.getElementById("add_task") as HTMLDialogElement;
    modal.close();
  });

  document.getElementById("save-api-key-button")?.addEventListener("click", async ()=>{
    let input: HTMLInputElement = document.getElementById("api-key-input") as HTMLInputElement;
    await setUserAPIKey(input.value);
    alert("API Key saved!");
  });

  console.log("API Key: ", getUserAPIKey());

  
});