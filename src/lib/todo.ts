export class Todo {
  id: string;
  text: string;
  deadline: number;
  matters: boolean;
  missedDeadline: boolean;
  completed: number | undefined;

  constructor(text: string, deadline: number) {
    this.id = Date.now().toString();
    this.text = text;
    this.deadline = deadline;
    this.matters = true;
    this.missedDeadline = false;
    this.completed = undefined;
  }

  markDone(now: number): void {
    if (!this.missedDeadline) {
      this.completed = now;
    }
  }

  failsDeadlineCheck(elapsed: number): boolean {
    if (!this.missedDeadline && !this.completed && elapsed >= this.deadline) {
      this.missedDeadline = true;
      return true;
    } else {
      return false;
    }
  }
}