import { BaseDirectory, exists, FileHandle, SeekMode, open } from "@tauri-apps/plugin-fs";
import { decrementCurrentlyClassifyingCount, getCurrentlyClassifyingCount, getFile, getSchedule, getTasks, getUserAPIKey, incrementCurrentlyClassifyingCount, setFile, setSchedule, setTasks, setUserAPIKey } from "./manager";
import { OpenRouter } from "@openrouter/sdk";
import { ChatResponse } from "@openrouter/sdk/models";
import { displaySchedule } from "./schedule";

export enum EisenhowerLoc {
  ImportantUrgent,
  ImportantNotUrgent,
  NotImportantUrgent,
  NotImportantNotUrgent
};

export enum TimelyWindow {
  Main,
  Schedule
}

export type Task = {
  title: string,
  description: string,
  timecreated: number,
  priority: number,
  eisenhowerloc: EisenhowerLoc
  duedate: Date
};

export type Day = {
  date: Date,
  tasks: Task[]
};

export type TimelyFile = {
  tasks: Task[],
  userAPIKey: string,
  schedule: Day[]
  timestamp: number,
};



export function updateClassifyingDisplay() {
  let displayElement: HTMLDivElement = document.getElementById("amount-classifying") as HTMLDivElement;
  if (getCurrentlyClassifyingCount() > 0) {
    displayElement.style.display = "block";
    displayElement.innerText = `Classifying ${getCurrentlyClassifyingCount()} task(s)...`;
  } else {
    displayElement.style.display = "none";
  }
}

export async function classifyTask(task: Task): Promise<EisenhowerLoc>{
  if (getUserAPIKey() != "") {
    console.log(`API Key: ${getUserAPIKey()}`);

    const openrouter: OpenRouter = new OpenRouter(
      {
        apiKey: getUserAPIKey(),
      }
    );

    console.log("Classifying task...");

    incrementCurrentlyClassifyingCount();
    updateClassifyingDisplay();
   

    const completion: ChatResponse = await openrouter.chat.send({
      model: "openrouter/free",
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

    let classification: string = completion.choices[0].message.content?.toString().trim().toLowerCase() || "";
    console.log(`Reasoning: ${completion.choices[0].message.reasoning}`);
    // let classification: string = await result.getText();
    // classification = classification.toLowerCase();
    console.log(`Classification result: ${classification}`);
    decrementCurrentlyClassifyingCount();
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

export function writeTimelyFile() {
  let timelyFile: TimelyFile = {tasks: getTasks(), userAPIKey: getUserAPIKey(), schedule: getSchedule(), timestamp: (new Date()).getTime()};
  // let file: FileHandle = getFile();
  // await file.seek(0, SeekMode.Start);
  // await file.write(new TextEncoder().encode(JSON.stringify(timelyFile)));
  console.log("saving storage...");
  localStorage.setItem("file", JSON.stringify(timelyFile));
  console.log(timelyFile);
  console.log("saved");
  // setFile(file);
}

export async function addTaskFromModal(){
  let titleInput: HTMLInputElement = document.getElementById("title-input") as HTMLInputElement;
  let descriptionInput: HTMLInputElement = document.getElementById("description-input") as HTMLInputElement;
  let classificationSelect: HTMLSelectElement = document.getElementById("classification-input") as HTMLSelectElement;
  let dueDateInput: HTMLInputElement = document.getElementById("due-date-input") as HTMLInputElement;
  let dueTimeInput: HTMLInputElement = document.getElementById("due-time-input") as HTMLInputElement;

  let title: string = titleInput.value;
  let description: string = descriptionInput.value;
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

  let tasks: Task[] = getTasks();
  tasks.push(task);
  await setTasks(tasks);
  displayTasksInMatrix();

  titleInput.value = "";
  descriptionInput.value = "";
  classificationSelect.selectedIndex = 0;
}

export function findTaskIndexFromDate(time: number): number {
  for (let i = 0; i < getTasks().length; i++) {
    if (getTasks()[i].timecreated === time) {
      return i;
    }
  }
  return -1;
}

export function createTaskDiv(task: Task, window: TimelyWindow): HTMLDivElement {
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
    taskDueDate.innerText = `Due: ${(task.duedate as Date).toLocaleString()}`;
    div.appendChild(taskDueDate);

    let deleteButton: HTMLButtonElement = document.createElement("button");
    deleteButton.innerText = "Delete Task";
    deleteButton.className = "delete-task-button";

    switch (window) {
      case TimelyWindow.Main:
        deleteButton.addEventListener("click", async ()=>{
          let timecreated: number = parseInt(div.dataset.timecreated || "0");
          await setTasks(getTasks().splice(findTaskIndexFromDate(timecreated), 1));
          displayTasksInMatrix();
        });
        break;
      case TimelyWindow.Schedule:
        deleteButton.addEventListener("click", async ()=>{
          let timecreated: number = parseInt(div.dataset.timecreated || "0");
          await setTasks(getTasks().splice(findTaskIndexFromDate(timecreated), 1));
          displaySchedule();
        });
        break;
      default:
        break;
    }
    
    div.appendChild(deleteButton);

    return div;
}

export function displayTasksInMatrix() {
  document.getElementById("important-urgent")?.replaceChildren();
  document.getElementById("important-noturgent")?.replaceChildren();
  document.getElementById("notimportant-urgent")?.replaceChildren();
  document.getElementById("notimportant-noturgent")?.replaceChildren();
  getTasks().forEach((task)=>{
    console.dir(task, {depth: null});
    let div: HTMLDivElement = createTaskDiv(task, TimelyWindow.Main);
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

export async function init(): Promise<void> {
  // // Do the File Stuff
  // let objectFileExists: boolean = await exists('timely.json', {
  //   baseDir: BaseDirectory.AppData
  // });

  // let file: FileHandle = await open('timely.json', {
  //   read: true,
  //   write: true,
  //   create: true,
  //   baseDir: BaseDirectory.AppData
  // });
  // setFile(file);

  // if (!objectFileExists) {
  //   await writeTimelyFile();
  // }

  // const stat = await file.stat();
  // const buf = new Uint8Array(stat.size);
  // await file.read(buf);
  // const textContents = new TextDecoder().decode(buf);
  if (localStorage.getItem("file") == null){
    console.log("file not found! rewriting...");
    await writeTimelyFile();
  }
  console.log("reading storage...");
  let timelyFile: TimelyFile = JSON.parse(localStorage.getItem("file") as string);
  console.log("read!");
  console.log(timelyFile);
  // setFile(file);
  console.log("setting tasks...");
  await setTasks(timelyFile.tasks || []);
  console.log("settings schedule...");
  await setSchedule(timelyFile.schedule || []);
  console.log("setting api key...");
  await setUserAPIKey(timelyFile.userAPIKey || "");

  console.log("fixing date strings...");
  // Convert date strings back to Date objects
  let tasks = getTasks();
  tasks.forEach((task, i) => {
    tasks[i].duedate = new Date(task.duedate);
  });
  await setTasks(tasks);
  console.log("fixed date strings.");

  console.log("fixing schedule dates...");
  let schedule = getSchedule();
  schedule.forEach((day, i) => {
    schedule[i].date = new Date(day.date);
    day.tasks.forEach((task, taskIndex) => {
      schedule[i].tasks[taskIndex].duedate = new Date(task.duedate);
    });
  });
  await setSchedule(schedule);
  console.log("fixed schedule dates.");

}