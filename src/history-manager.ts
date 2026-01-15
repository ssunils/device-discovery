import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export interface HistoryEvent {
  type: "search" | "status_change" | "rtt_sample";
  timestamp: string;
  jid: string;
  platform: "whatsapp" | "signal";
  data: any;
}

class HistoryManager {
  private historyDir = "data";
  private historyFile = "history.json";
  private historyPath: string;
  private events: HistoryEvent[] = [];
  private isLoaded = false;

  constructor() {
    this.historyPath = path.join(this.historyDir, this.historyFile);
  }

  private async ensureLoaded() {
    if (this.isLoaded) return;
    try {
      if (!existsSync(this.historyDir)) {
        await mkdir(this.historyDir, { recursive: true });
      }
      if (existsSync(this.historyPath)) {
        const content = await readFile(this.historyPath, "utf-8");
        this.events = JSON.parse(content);
      } else {
        this.events = [];
        await this.save();
      }
      this.isLoaded = true;
    } catch (e) {
      console.error("[HISTORY] Failed to load history:", e);
      this.events = [];
      this.isLoaded = true;
    }
  }

  private async save() {
    try {
      if (!existsSync(this.historyDir)) {
        await mkdir(this.historyDir, { recursive: true });
      }
      await writeFile(this.historyPath, JSON.stringify(this.events, null, 2));
    } catch (e) {
      console.error("[HISTORY] Failed to save history:", e);
    }
  }

  public async logEvent(
    type: HistoryEvent["type"],
    jid: string,
    platform: HistoryEvent["platform"],
    data: any
  ) {
    await this.ensureLoaded();
    const event: HistoryEvent = {
      type,
      timestamp: new Date().toISOString(),
      jid,
      platform,
      data,
    };
    
    // Limit history size to prevent file bloat (e.g., last 5000 events)
    this.events.push(event);
    if (this.events.length > 5000) {
      this.events = this.events.slice(-5000);
    }
    
    await this.save();
  }

  public async getHistory() {
    await this.ensureLoaded();
    return this.events;
  }

  public async clearHistory() {
    this.events = [];
    await this.save();
  }
}

export const historyManager = new HistoryManager();
