import { OpenRouter } from "@openrouter/sdk";
import { getSchedule, getTasks, getUserAPIKey, setSchedule } from "./manager";
import { createTaskDiv, Day, EisenhowerLoc, init, Task, TimelyWindow } from "./timely";
import { ChatResponse } from "@openrouter/sdk/models";

export async function createSchedule(): Promise<void> {
    if (getUserAPIKey() == "") {
        alert("Please add your API key first!");
        return;
    }
    let tasks: Task[] = getTasks();
    let schedule: Day[] = [];

    console.log("User API Key: ", getUserAPIKey());
    const openrouter: OpenRouter = new OpenRouter(
        {
            apiKey: getUserAPIKey(),
        }
    );

    console.log("Generating schedule...");

    const completion: ChatResponse = await openrouter.chat.send({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: "You are a task scheduler. You must determine how many days a given list of tasks will take. Then, you must return a comma seperated list of task numbers in the order they should be completed, broken by newlines for each day that the tasks should span. If you think a task may take more than one day, then include its task number in each day line that it should be worked on. The first line outputted is considered day 1, the next line day 2, and so on for each day that must be taken in order to fulfill all given tasks. All overdue tasks must still be scheduled, but consider importance: an overdue task that is not important should not take precedence over a crucial task that is not yet overdue. Do not assume all tasks take only one day, use the tasks name, description, and due date to make informed decisions about each task. Respond only with the comma seperated list of task numbers broken by newlines, in a computer readable non-markdown format."
            },
            {
              role: "user",
              content: `Today is ${new Date().toUTCString()}. Here is the list of tasks:
${tasks.map((task, index) => `${index + 1}. ${task.title}: ${task.description} - Classification: ${EisenhowerLoc[task.eisenhowerloc]} - Due: ${task.duedate.toUTCString()}`).join('\n')}
`
            }
          ],
          stream: false,
          reasoning: {
            effort: "high",
          }
        });
    
    console.log("Schedule reasoning: ", completion.choices[0].message.reasoning);
    console.log("Schedule response:", completion.choices[0].message.content);

    let scheduleText: string = completion.choices[0].message.content?.toString().trim() || "";
    let scheduleLines: string[] = scheduleText.split('\n');

    scheduleLines.forEach((line, dayIndex) => {
        schedule.push({date: new Date(new Date().getTime() + dayIndex * 24 * 60 * 60 * 1000), tasks: []});
        let taskNumbersAsStrings: string[] = line.split(',').map(s => s.trim());
        taskNumbersAsStrings.forEach((taskNumStr) => {
            let taskNum: number = parseInt(taskNumStr);
            if (!isNaN(taskNum) && taskNum > 0 && taskNum <= tasks.length) {
                schedule[dayIndex].tasks.push(tasks[taskNum - 1]);
            }
        });
    });

    await setSchedule(schedule);
    displaySchedule();
}

export async function displaySchedule(): Promise<void> {
    let schedule: Day[] = getSchedule();
    let scheduleContainer: HTMLElement = document.getElementById("schedule-display") as HTMLElement;
    scheduleContainer.replaceChildren();

    schedule.forEach((day) => {
        let dayDiv: HTMLDivElement = document.createElement("div");
        dayDiv.className = "schedule-day";

        let dateHeader: HTMLHeadingElement = document.createElement("h3");
        dateHeader.innerText = `Date: ${day.date.toDateString()}`;
        dayDiv.appendChild(dateHeader);

        day.tasks.forEach((task) => {
            dayDiv.appendChild(createTaskDiv(task, TimelyWindow.Schedule));
        });

        scheduleContainer.appendChild(dayDiv);
    });
}

window.addEventListener("DOMContentLoaded", async ()=>{
    if ((document.querySelector('meta[name="page"]') as HTMLMetaElement).content == "schedule"){
        await init();
        console.dir(getSchedule(), {depth: null});
        document.getElementById("schedule-button")?.addEventListener("click", async ()=>{
            await createSchedule();
        });
        displaySchedule();
    }
});