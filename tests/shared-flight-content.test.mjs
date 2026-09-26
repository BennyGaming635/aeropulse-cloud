import test from 'node:test';
import assert from 'node:assert/strict';
import { sharedFlightSchema, sharedContent } from '../lib/shared-flight-content.ts';
const basics = {flightNumber:'ua901',originCode:'sfo',destinationCode:'lhr',scheduledDeparture:'2026-10-01T10:00:00Z',scheduledArrival:'2026-10-01T20:00:00Z'};
const privateContent = {status:'In flight',gate:'A1',seat:'12A',confirmationCode:'PRIVATE',notes:'Private note',timelineNotes:[{text:'Private timeline',createdAt:'2026-10-01T10:00:00Z'}],apiKey:'SECRET',attachments:['unvalidated']};
test('legacy callers default to basics; server strips private fields', () => {
  const value = sharedFlightSchema.parse({...basics,details:privateContent});
  assert.equal(value.sharingLevel,'basics'); assert.deepEqual(value.details,{}); assert.equal(value.flightNumber,'UA901');
});
test('some detail includes operational data only', () => {
  assert.deepEqual(sharedContent('details',privateContent),{status:'In flight',gate:'A1'});
});
test('everything includes opted-in booking data and notes, never credentials or arbitrary attachments', () => {
  const content = sharedContent('everything',privateContent);
  assert.equal(content.confirmationCode,'PRIVATE'); assert.equal(content.timelineNotes[0].text,'Private timeline');
  assert.equal(content.apiKey,undefined); assert.equal(content.attachments,undefined);
});
test('file and attachment fields are stripped even at everything', () => {
  const value = sharedFlightSchema.parse({...basics,sharingLevel:'everything',attachmentCount:2,attachments:[{filename:'private.pdf',base64:'SECRET'}],details:privateContent});
  assert.equal(value.attachmentCount,undefined);
  assert.equal(value.attachments,undefined);
  assert.equal(value.details.attachments,undefined);
});
test('invalid schedules and sharing levels fail', () => {
  assert.throws(() => sharedFlightSchema.parse({...basics,scheduledArrival:'2026-09-30T20:00:00Z'}));
  assert.throws(() => sharedFlightSchema.parse({...basics,sharingLevel:'unknown'}));
});
