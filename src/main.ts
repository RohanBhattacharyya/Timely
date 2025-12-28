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
  priority: number,
  eisenhowerloc: EisenhowerLoc
};

type TimelyFile = {
  tasks: Task[],
  userAPIKey: string
};


let file: FileHandle;
let tasks: Task[];
let userAPIKey: string = "";

async function classifyTask(task: Task): Promise<EisenhowerLoc>{
  if (userAPIKey != "") {
    console.log(`API Key: ${userAPIKey}`);

    const openrouter: OpenRouter = new OpenRouter(
      {
        apiKey: userAPIKey,
      }
    );

    console.log("Classifying task...");

    // const completion: ChatResponse = await openrouter.chat.send({
    //   model: "openai/gpt-oss-20b:free",
    //   messages: [
    //     {
    //       role: "system",
    //       content: "You are an Eisenhower Matrix classifier. You will classify a given task into one of four categories: Important Urgent, Important Not Urgent, Not Important Urgent, Not Important Not Urgent. Respond only with the category name in a computer readable non-markdown format."
    //     },
    //     {
    //       role: "user",
    //       content: `Classify the following task: ${task.title}`
    //     }
    //   ],
    //   stream: false,
    //   // reasoning: {
    //   //   effort: "high",
    //   // }
    // });

    const result = openrouter.callModel({
      model: "openai/gpt-oss-20b:free",
      instructions: "You are an Eisenhower Matrix classifier. You will classify a given task into one of four categories: Important Urgent, Important Not Urgent, Not Important Urgent, Not Important Not Urgent. Respond only with the category name in a computer readable non-markdown format.",
      input: `Classify the following task: ${task.title}`,
      reasoning: {
        effort: "high",
        enabled: true
      },
    })

    // let classification: string = completion.choices[0].message.content?.toString().trim().toLowerCase() || "";
    // console.log(`Reasoning: ${completion.choices[0].message.reasoning}`);
    let classification: string = await result.getText();
    classification = classification.toLowerCase();
    console.log(`Classification result: ${classification}`);

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

async function addTaskFromPrompt(){

  let name: string = prompt("Task name?") || "";
  let task: Task = {title: name, priority: 1, eisenhowerloc: EisenhowerLoc.ImportantUrgent};
  let eisenhowerloc: EisenhowerLoc = await classifyTask(task);
  task.eisenhowerloc = eisenhowerloc;
  tasks.push(task);
  displayTasksInMatrix();
  writeTimelyFile();

}

function displayTasksInMatrix() {
  tasks.forEach((task)=>{
    let div: HTMLDivElement = document.createElement("div");
    div.className = "task";
    let taskTitle: HTMLHeadingElement = document.createElement("h3");
    taskTitle.innerText = task.title;
    div.appendChild(taskTitle);
    let taskDescription: HTMLParagraphElement = document.createElement("p");
    taskDescription.innerText = "Work in progress...";
    div.appendChild(taskDescription);

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
  userAPIKey = timelyFile.userAPIKey || "";

  let apiKeyInput: HTMLInputElement = document.getElementById("api-key-input") as HTMLInputElement;
  apiKeyInput.value = userAPIKey;

  displayTasksInMatrix();

  document.getElementById("add-task-button")?.addEventListener("click", ()=>{
    addTaskFromPrompt();
  });

  document.getElementById("save-api-key-button")?.addEventListener("click", ()=>{
    let input: HTMLInputElement = document.getElementById("api-key-input") as HTMLInputElement;
    userAPIKey = input.value;
    writeTimelyFile();
    alert("API Key saved!");
  });


  
});