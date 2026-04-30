import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TasksPanel } from "@/components/workspace-desktop/DesktopPanels";
import { Task } from "@/types/workspace";

describe("DesktopPanels", () => {
  it("does not mutate the incoming task array while sorting the visible list", () => {
    const tasks: Task[] = [
      {
        id: "task-low",
        title: "Lower priority",
        completed: false,
        priority: "low",
        tag: "Project",
        dueToday: false,
        createdAt: "2026-04-26T08:00:00.000Z",
        updatedAt: "2026-04-26T08:00:00.000Z",
        order: 0,
      },
      {
        id: "task-high",
        title: "Higher priority",
        completed: false,
        priority: "high",
        tag: "Project",
        dueToday: false,
        createdAt: "2026-04-26T08:05:00.000Z",
        updatedAt: "2026-04-26T08:05:00.000Z",
        order: 1,
      },
    ];

    render(
      <TasksPanel
        tasks={tasks}
        onTaskCreate={vi.fn()}
        onTaskToggle={vi.fn()}
        onTaskPriorityChange={vi.fn()}
        onTaskMove={vi.fn()}
        onTaskUpdate={vi.fn()}
        onTaskDelete={vi.fn()}
        onTaskFocusSelect={vi.fn()}
        onTaskDueDateUpdate={vi.fn()}
      />,
    );

    expect(tasks.map((task) => task.id)).toEqual(["task-low", "task-high"]);
  });
});
