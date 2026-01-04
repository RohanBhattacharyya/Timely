import { OpenRouter } from "@openrouter/sdk";
import { ChatResponse } from "@openrouter/sdk/models";
import { BaseDirectory, exists, FileHandle, open, SeekMode } from "@tauri-apps/plugin-fs";

enum EisenhowerLoc {
  ImportantUrgent,
  ImportantNotUrgent,
  NotImportantUrgent,
  NotImportantNotUrgent
};

type Task = {
  title: string,
  description: string,
  timecreated: number,
  priority: number,
  eisenhowerloc: EisenhowerLoc
  duedate: Date
};

type TimelyFile = {
  tasks: Task[],
  userAPIKey: string
};


let file: FileHandle;
let tasks: Task[];
let userAPIKey: string = "";
let currentlyClassifyingCount: number = 0;

function updateClassifyingDisplay() {
  let displayElement: HTMLDivElement = document.getElementById("amount-classifying") as HTMLDivElement;
  if (currentlyClassifyingCount > 0) {
    displayElement.style.display = "block";
    displayElement.innerText = `Classifying ${currentlyClassifyingCount} task(s)...`;
  } else {
    displayElement.style.display = "none";
  }
}

async function classifyTask(task: Task): Promise<EisenhowerLoc>{
  if (userAPIKey != "") {
    console.log(`API Key: ${userAPIKey}`);

    const openrouter: OpenRouter = new OpenRouter(
      {
        apiKey: userAPIKey,
      }
    );

    console.log("Classifying task...");

    currentlyClassifyingCount++;
    updateClassifyingDisplay();
   

    const completion: ChatResponse = await openrouter.chat.send({
      model: "xiaomi/mimo-v2-flash:free",
      messages: [
        {
          role: "system",
          content: "You are an Eisenhower Matrix classifier. You will classify a given task into one of four categories: Important Urgent, Important Not Urgent, Not Important Urgent, Not Important Not Urgent. Respond only with the category name in a computer readable non-markdown format."
        },
        {
          role: "user",
          content: `Classify the following task: ${task.title}. Here is a more detailed description: "${task.description}". It is due on ${task.duedate.toUTCString()}. The current date is ${new Date().toUTCString()}.`
        }
      ],
      stream: false,
      reasoning: {
        effort: "high",
      }
    });

    // let result;
    // try {
    //   result = openrouter.callModel({
    //   model: "xiaomi/mimo-v2-flash:free",
    //   instructions: "You are an Eisenhower Matrix classifier. You will classify a given task into one of four categories: Important Urgent, Important Not Urgent, Not Important Urgent, Not Important Not Urgent. Respond only with the category name in a computer readable non-markdown format.",
    //   input: `Classify the following task: ${task.title}`,
    //   reasoning: {
    //     effort: "high",
    //     enabled: true
    //   },
    // })
    // } catch (error) {
    //   console.error("Error during classification:", error);
    //   return EisenhowerLoc.ImportantUrgent;
    // }

    

    let classification: string = completion.choices[0].message.content?.toString().trim().toLowerCase() || "";
    console.log(`Reasoning: ${completion.choices[0].message.reasoning}`);
    // let classification: string = await result.getText();
    // classification = classification.toLowerCase();
    console.log(`Classification result: ${classification}`);
    currentlyClassifyingCount--;
    updateClassifyingDisplay();

    if (classification.includes("not important") && classification.includes("not urgent")) {
      return EisenhowerLoc.NotImportantNotUrgent;
    } else if (classification.includes("important") && classification.includes("not urgent")) {
      return EisenhowerLoc.ImportantNotUrgent;
    } else if (classification.includes("not important") && classification.includes("urgent")) {
      return EisenhowerLoc.NotImportantUrgent;
    } else if (classification.includes("important") && classification.includes("urgent")) {
      return EisenhowerLoc.ImportantUrgent;
    }
    
  }
  return EisenhowerLoc.ImportantUrgent;
}

function writeTimelyFile() {
  let timelyFile: TimelyFile = {tasks: tasks, userAPIKey: userAPIKey};
  file.truncate(0);
  file.seek(0, SeekMode.Start);
  file.write(new TextEncoder().encode(JSON.stringify(timelyFile)));
}

async function addTaskFromJSPrompt(){

  let name: string = prompt("Task name?") || "";
  let task: Task = {title: name, priority: 1, eisenhowerloc: EisenhowerLoc.ImportantUrgent, timecreated: Date.now(), description: "", duedate: new Date()};
  let eisenhowerloc: EisenhowerLoc = await classifyTask(task);
  task.eisenhowerloc = eisenhowerloc;
  tasks.push(task);
  displayTasksInMatrix();
  writeTimelyFile();

}

async function addTaskFromModal(){
  let titleInput: HTMLInputElement = document.getElementById("title-input") as HTMLInputElement;
  let descriptionInput: HTMLInputElement = document.getElementById("description-input") as HTMLInputElement;
  let classificationSelect: HTMLSelectElement = document.getElementById("classification-input") as HTMLSelectElement;
  let dueDateInput: HTMLInputElement = document.getElementById("due-date-input") as HTMLInputElement;
  let dueTimeInput: HTMLInputElement = document.getElementById("due-time-input") as HTMLInputElement;

  let title: string = titleInput.value;
  let description: string = descriptionInput.value;
  let classification: string = classificationSelect.options[classificationSelect.selectedIndex].value;
  let dueDate: Date | null = dueDateInput.valueAsDate;
  if (dueDate == null) {
    console.log("Due date not set, using current date");
    dueDate = new Date();
  }
  dueDate.setTime(dueDate.getTime()+dueTimeInput.valueAsNumber);

  let task: Task = {title: title, description: description, priority: 1, eisenhowerloc: EisenhowerLoc.ImportantUrgent, timecreated: Date.now(), duedate: dueDate};

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

  tasks.push(task);
  displayTasksInMatrix();
  writeTimelyFile();

  titleInput.value = "";
  descriptionInput.value = "";
  classificationSelect.selectedIndex = 0;
}

function findTaskIndexFromDate(time: number): number {
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].timecreated === time) {
      return i;
    }
  }
  return -1;
}

function displayTasksInMatrix() {
  document.getElementById("important-urgent")?.replaceChildren();
  document.getElementById("important-noturgent")?.replaceChildren();
  document.getElementById("notimportant-urgent")?.replaceChildren();
  document.getElementById("notimportant-noturgent")?.replaceChildren();
  tasks.forEach((task)=>{
    console.dir(task, {depth: null});
    let div: HTMLDivElement = document.createElement("div");
    div.className = "task";
    div.dataset.timecreated = task.timecreated.toString();
    let taskTitle: HTMLHeadingElement = document.createElement("h3");
    taskTitle.innerText = task.title;
    div.appendChild(taskTitle);
    let taskDescription: HTMLParagraphElement = document.createElement("p");
    taskDescription.innerText = task.description;
    div.appendChild(taskDescription);
    let taskDueDate: HTMLParagraphElement = document.createElement("p");
    taskDueDate.innerText = `Due: ${(task.duedate as Date).toUTCString().slice(0, -4)}`;
    div.appendChild(taskDueDate);

    let deleteButton: HTMLButtonElement = document.createElement("button");
    deleteButton.innerText = "Delete Task";
    deleteButton.className = "delete-task-button";
    deleteButton.addEventListener("click", ()=>{
      let timecreated: number = parseInt(div.dataset.timecreated || "0");
      tasks.splice(findTaskIndexFromDate(timecreated), 1);
      writeTimelyFile();
      displayTasksInMatrix();
    });
    div.appendChild(deleteButton);

    switch (task.eisenhowerloc) {
      case EisenhowerLoc.ImportantUrgent:
        document.getElementById("important-urgent")?.appendChild(div);
        break;
    
      case EisenhowerLoc.ImportantNotUrgent:
        document.getElementById("important-noturgent")?.appendChild(div);
        break;
      
      case EisenhowerLoc.NotImportantUrgent:
        document.getElementById("notimportant-urgent")?.appendChild(div);
        break;
      
      case EisenhowerLoc.NotImportantNotUrgent:
        document.getElementById("notimportant-noturgent")?.appendChild(div);
        break;
      default:
        break;
    }
  });
}

window.addEventListener("DOMContentLoaded", async ()=>{
  // Do the File Stuff
  let objectFileExists: boolean = await exists('timely.json', {
    baseDir: BaseDirectory.AppData
  });

  file = await open('timely.json', {
    read: true,
    write: true,
    create: true,
    baseDir: BaseDirectory.AppData
  });

  if (!objectFileExists) {
    writeTimelyFile();
  }

  const stat = await file.stat();
  const buf = new Uint8Array(stat.size);
  await file.read(buf);
  const textContents = new TextDecoder().decode(buf);
  let timelyFile: TimelyFile = JSON.parse(textContents);
  tasks = timelyFile.tasks || [];

  // Convert duedate strings back to Date objects
  tasks.forEach(task => {
    task.duedate = new Date(task.duedate);
  });

  userAPIKey = timelyFile.userAPIKey || "";

  let apiKeyInput: HTMLInputElement = document.getElementById("api-key-input") as HTMLInputElement;
  apiKeyInput.value = userAPIKey;

  // console.dir(tasks, {depth: null});
  displayTasksInMatrix();

  document.getElementById("add-task-button")?.addEventListener("click", ()=>{
    addTaskFromModal();
    let modal = document.getElementById("add_task") as HTMLDialogElement;
    modal.close();
  });

  document.getElementById("save-api-key-button")?.addEventListener("click", ()=>{
    let input: HTMLInputElement = document.getElementById("api-key-input") as HTMLInputElement;
    userAPIKey = input.value;
    writeTimelyFile();
    alert("API Key saved!");
  });


  
});