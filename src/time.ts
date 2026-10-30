import { config } from "./config.ts";

export const addDays = (day: string, days: number) => Temporal.PlainDate.from(day).add({ days }).toString();

export const getPublishTime = (day: string) => Temporal.ZonedDateTime.from(`${day}T${config.publishAt}`);
