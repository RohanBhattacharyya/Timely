import { addTaskFromModal, classifyTask, displayTasksInMatrix, EisenhowerLoc, findTaskIndexFromDate, init, Task, writeTimelyFile } from "./timely";
import { getTasks, getUserAPIKey, setTasks, setUserAPIKey } from "./manager";


window.addEventListener("DOMContentLoaded", async ()=>{
  if ((document.querySelector('meta[name="page"]') as HTMLMetaElement).content == "main"){
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

    document.getElementById("edit-task-modal-button")?.addEventListener("click", async ()=>{
      let modal: HTMLDialogElement = document.getElementById("edit_task") as HTMLDialogElement;

      let titleInput: HTMLInputElement = document.getElementById("edit-title-input") as HTMLInputElement;
      let descriptionInput: HTMLInputElement = document.getElementById("edit-description-input") as HTMLInputElement;
      let classificationSelect: HTMLSelectElement = document.getElementById("edit-classification-input") as HTMLSelectElement;
      let dueDateInput: HTMLInputElement = document.getElementById("edit-due-date-input") as HTMLInputElement;
      let dueTimeInput: HTMLInputElement = document.getElementById("edit-due-time-input") as HTMLInputElement;
      let classification: string = classificationSelect.options[classificationSelect.selectedIndex].value;

      let dueDateStringUTC = dueDateInput.value;
      let dates: string[] = dueDateStringUTC.split("-");
      let dueDate: Date = new Date(parseInt(dates[0]), parseInt(dates[1])-1, parseInt(dates[2]));
      if (dueDate == null) {
        console.log("Due date not set, using current date");
        dueDate = new Date();
      }
      dueDate.setHours(parseInt(dueTimeInput.value.split(":")[0]));
      dueDate.setMinutes(parseInt(dueTimeInput.value.split(":")[1]));

      let div: HTMLDivElement = document.querySelector('div[data-editing="true"]') as HTMLDivElement;
      div.dataset.editing = "false";
      let task: Task = getTasks()[findTaskIndexFromDate(parseInt(div.dataset.timecreated || "0"))];

      task.description = descriptionInput.value;
      task.title = titleInput.value;
      task.duedate = dueDate;
      
      modal.close(); // Close before classification, which may take a long time.
      switch (classification) {
          case "important-urgent":
            task.eisenhowerloc = EisenhowerLoc.ImportantUrgent;
            break;
          
          case "important-noturgent":
            task.eisenhowerloc = EisenhowerLoc.ImportantNotUrgent;
            break;
          
          case "notimportant-urgent":
            task.eisenhowerloc = EisenhowerLoc.NotImportantUrgent;
            break;
          
          case "notimportant-noturgent":
            task.eisenhowerloc = EisenhowerLoc.NotImportantNotUrgent;
            break;
          
          default:
            let eisenhowerloc: EisenhowerLoc = await classifyTask(task);
            task.eisenhowerloc = eisenhowerloc;
            break;
      }
      writeTimelyFile();
      displayTasksInMatrix();
    });
  
    document.getElementById("save-api-key-button")?.addEventListener("click", async ()=>{
      let input: HTMLInputElement = document.getElementById("api-key-input") as HTMLInputElement;
      await setUserAPIKey(input.value);
      alert("API Key saved!");
    });
  
    console.log("API Key: ", getUserAPIKey());
  }
});