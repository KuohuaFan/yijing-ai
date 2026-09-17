import type { ChatRecord } from "./chatHistory";

export function filterChatRecords(records: ChatRecord[], query: string) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return records;
  return records.filter((record) => [
    record.title,
    record.project,
    ...(record.tags ?? []),
    ...record.messages.map((message) => message.content),
  ].join("\n").toLocaleLowerCase().includes(needle));
}

export function buildHistoryGroups(records: ChatRecord[], activeId: string | null, query: string) {
  const searched = filterChatRecords(records, query);
  return {
    searched,
    active: records.find((record) => record.id === activeId),
    starred: searched.filter((record) => record.starred),
    allChats: searched.filter((record) => record.id !== activeId),
    projects: Array.from(new Set(records.map((record) => record.project.trim()).filter(Boolean))),
  };
}
