import { z } from "zod";

export const sharingLevelSchema = z.enum(["basics", "details", "everything"]);
export type SharingLevel = z.infer<typeof sharingLevelSchema>;
const text = (max: number) => z.string().max(max).optional().nullable();
const date = z.string().datetime({ offset: true }).optional().nullable();
const operationalSchema = z.object({
  status: text(40), estimatedDeparture: date, estimatedArrival: date,
  aircraft: text(120), registration: text(40), terminal: text(40), gate: text(40),
  arrivalTerminal: text(40), arrivalGate: text(40), baggageClaim: text(40),
});
const everythingSchema = operationalSchema.extend({
  seat: text(40), confirmationCode: text(100), notes: text(20000),
  timelineNotes: z.array(z.object({ text: z.string().max(20000), createdAt: z.string().datetime({ offset: true }) })).max(200).optional(),
});
export type SharedFlightDetails = z.infer<typeof everythingSchema>;
export function sharedContent(level: SharingLevel, value: unknown): SharedFlightDetails {
  if (level === "basics") return {};
  return (level === "details" ? operationalSchema : everythingSchema).parse(value ?? {});
}
export const sharedFlightSchema = z.object({
  flightNumber: z.string().trim().min(1).max(16).transform(v => v.toUpperCase()),
  airlineName: z.string().trim().max(100).optional().transform(v => v || null),
  originCode: z.string().trim().regex(/^[A-Za-z]{3}$/).transform(v => v.toUpperCase()),
  destinationCode: z.string().trim().regex(/^[A-Za-z]{3}$/).transform(v => v.toUpperCase()),
  scheduledDeparture: z.string().datetime({ offset: true }),
  scheduledArrival: date,
  sharingLevel: sharingLevelSchema.default("basics"),
  details: z.unknown().optional(),
}).refine(v => !v.scheduledArrival || Date.parse(v.scheduledArrival) >= Date.parse(v.scheduledDeparture), {
  message: "Arrival must be on or after departure",
}).transform(v => ({ ...v, details: sharedContent(v.sharingLevel, v.details) }));
