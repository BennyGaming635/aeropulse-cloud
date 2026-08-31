"use client";

import { FormEvent, useEffect, useState } from "react";
import type { SharedTripView } from "@/lib/shared-trips";

type APIResult = { error?: string; trips?: SharedTripView[]; trip?: { id: string }; invite?: { url: string; expiresAt: string } };

async function apiRequest(path: string, method: string, body?: unknown): Promise<APIResult> {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json() as APIResult;
  if (!response.ok) throw new Error(result.error || "Aero could not complete this request");
  return result;
}

export default function SharedTripsPanel({ initialTripID }: { initialTripID?: string }) {
  const [trips, setTrips] = useState<SharedTripView[]>([]);
  const [selectedID, setSelectedID] = useState(initialTripID || "");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTrips(preferredID?: string) {
    const result = await apiRequest("/api/shared-trips", "GET");
    const nextTrips = result.trips || [];
    setTrips(nextTrips);
    setSelectedID((current) => {
      const preferred = preferredID || current;
      return nextTrips.some((trip) => trip.id === preferred) ? preferred : nextTrips[0]?.id || "";
    });
  }

  useEffect(() => {
    let active = true;
    apiRequest("/api/shared-trips", "GET")
      .then((result) => {
        if (!active) return;
        const nextTrips = result.trips || [];
        setTrips(nextTrips);
        setSelectedID((current) => nextTrips.some((trip) => trip.id === current) ? current : nextTrips[0]?.id || "");
      })
      .catch((requestError) => active && setError(requestError instanceof Error ? requestError.message : "Could not load shared trips"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function createTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const result = await apiRequest("/api/shared-trips", "POST", {
        name,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setName("");
      setStartDate("");
      setEndDate("");
      await loadTrips(result.trip?.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create this trip");
    } finally {
      setCreating(false);
    }
  }

  const selected = trips.find((trip) => trip.id === selectedID);

  return (
    <section className="shared-trips-card" id="shared-trips">
      <div className="shared-trips-heading">
        <div>
          <p className="eyebrow">AERO ID SHARING</p>
          <h2>Shared trips</h2>
          <p>Coordinate a public flight snapshot with people you invite. Your private Aero data stays separate.</p>
        </div>
        <span>{trips.length.toString().padStart(2, "0")} TRIPS</span>
      </div>

      <form className="shared-trip-create" onSubmit={createTrip}>
        <label>Trip name<input required maxLength={120} placeholder="Summer in Lisbon" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Starts<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>Ends<input min={startDate || undefined} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        <button className="button primary" disabled={creating} type="submit">{creating ? "Creating..." : "Create shared trip"}</button>
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <p className="shared-empty">Loading shared trips...</p> : trips.length === 0 ? (
        <p className="shared-empty">No shared trips yet. Create one above, then invite another Aero ID.</p>
      ) : (
        <>
          <div className="trip-switcher" role="tablist" aria-label="Shared trips">
            {trips.map((trip) => (
              <button className={trip.id === selectedID ? "active" : ""} key={trip.id} onClick={() => setSelectedID(trip.id)} role="tab" type="button">
                <strong>{trip.name}</strong><span>{trip.members.length} member{trip.members.length === 1 ? "" : "s"}</span>
              </button>
            ))}
          </div>
          {selected && <TripWorkspace key={`${selected.id}:${selected.version}`} trip={selected} onChanged={() => loadTrips(selected.id)} />}
        </>
      )}
    </section>
  );
}

function TripWorkspace({ trip, onChanged }: { trip: SharedTripView; onChanged: () => Promise<void> }) {
  const [name, setName] = useState(trip.name);
  const [startDate, setStartDate] = useState(trip.startDate || "");
  const [endDate, setEndDate] = useState(trip.endDate || "");
  const [inviteURL, setInviteURL] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [airlineName, setAirlineName] = useState("");
  const [originCode, setOriginCode] = useState("");
  const [destinationCode, setDestinationCode] = useState("");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Aero could not complete this request");
    } finally {
      setBusy(false);
    }
  }

  function saveTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await apiRequest(`/api/shared-trips/${trip.id}`, "PATCH", {
        baseVersion: trip.version,
        name,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      setMessage("Trip details updated.");
      await onChanged();
    });
  }

  function createInvite() {
    void run(async () => {
      const result = await apiRequest(`/api/shared-trips/${trip.id}/invites`, "POST", { expiresInHours: 72, maxUses: 25 });
      setInviteURL(result.invite?.url || "");
      setMessage("Invite ready for 72 hours.");
    });
  }

  function addFlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await apiRequest(`/api/shared-trips/${trip.id}/flights`, "POST", {
        flightNumber,
        airlineName: airlineName || undefined,
        originCode,
        destinationCode,
        scheduledDeparture: new Date(departure).toISOString(),
        scheduledArrival: arrival ? new Date(arrival).toISOString() : undefined,
      });
      setFlightNumber("");
      setAirlineName("");
      setOriginCode("");
      setDestinationCode("");
      setDeparture("");
      setArrival("");
      setMessage("Flight shared without private booking details.");
      await onChanged();
    });
  }

  function removeFlight(flightID: string) {
    void run(async () => {
      await apiRequest(`/api/shared-trips/${trip.id}/flights`, "DELETE", { flightID });
      setMessage("Shared flight removed.");
      await onChanged();
    });
  }

  function removeMember(membershipID: string, isCurrent: boolean) {
    const prompt = isCurrent ? "Leave this shared trip?" : "Remove this member from the shared trip?";
    if (!window.confirm(prompt)) return;
    void run(async () => {
      await apiRequest(`/api/shared-trips/${trip.id}/memberships`, "DELETE", { membershipID });
      setMessage(isCurrent ? "You left the shared trip." : "Member removed.");
      await onChanged();
    });
  }

  return (
    <div className="trip-workspace">
      <div className="trip-summary">
        <div><span>ROLE</span><strong>{trip.role}</strong></div>
        <div><span>DATES</span><strong>{trip.startDate || "Open"} / {trip.endDate || "Open"}</strong></div>
        <div><span>VERSION</span><strong>{trip.version}</strong></div>
      </div>

      {trip.canManage && (
        <form className="trip-edit-form" onSubmit={saveTrip}>
          <label>Name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Starts<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label>Ends<input min={startDate || undefined} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <button disabled={busy} type="submit">Save details</button>
        </form>
      )}

      <div className="sharing-grid">
        <section className="trip-members">
          <div className="shared-subheading"><h3>Members</h3>{trip.canManage && <button disabled={busy} onClick={createInvite} type="button">Create invite</button>}</div>
          {inviteURL && (
            <div className="invite-output">
              <input aria-label="Invite link" readOnly value={inviteURL} />
              <button onClick={() => void navigator.clipboard.writeText(inviteURL).then(() => setMessage("Invite copied."))} type="button">Copy</button>
            </div>
          )}
          <div className="member-list">
            {trip.members.map((member) => (
              <div className="member-row" key={member.id}>
                <span className="member-avatar">{(member.displayName || member.username).slice(0, 2).toUpperCase()}</span>
                <div><strong>{member.displayName || member.username}{member.isCurrent ? " (you)" : ""}</strong><small>@{member.username} / {member.aeroID}</small></div>
                <span className="member-role">{member.role}</span>
                {member.role === "member" && (member.isCurrent || trip.canManage) && (
                  <button className="remove-link" disabled={busy} onClick={() => removeMember(member.id, member.isCurrent)} type="button">{member.isCurrent ? "Leave" : "Remove"}</button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="trip-flights">
          <div className="shared-subheading"><h3>Flights</h3><span>{trip.flights.length} SHARED</span></div>
          <form className="flight-share-form" onSubmit={addFlight}>
            <input aria-label="Flight number" maxLength={16} placeholder="Flight, e.g. UA901" required value={flightNumber} onChange={(event) => setFlightNumber(event.target.value)} />
            <input aria-label="Airline" maxLength={100} placeholder="Airline (optional)" value={airlineName} onChange={(event) => setAirlineName(event.target.value)} />
            <input aria-label="Origin airport" maxLength={3} pattern="[A-Za-z]{3}" placeholder="SFO" required value={originCode} onChange={(event) => setOriginCode(event.target.value.toUpperCase())} />
            <input aria-label="Destination airport" maxLength={3} pattern="[A-Za-z]{3}" placeholder="LHR" required value={destinationCode} onChange={(event) => setDestinationCode(event.target.value.toUpperCase())} />
            <label>Departure<input required type="datetime-local" value={departure} onChange={(event) => setDeparture(event.target.value)} /></label>
            <label>Arrival <span>optional</span><input min={departure || undefined} type="datetime-local" value={arrival} onChange={(event) => setArrival(event.target.value)} /></label>
            <button disabled={busy} type="submit">Share flight</button>
          </form>
          <p className="redaction-note">Only flight number, airline, route, and scheduled times are shared. Never seats, confirmation codes, provider keys, notes, or attachments.</p>
          <div className="shared-flight-list">
            {trip.flights.length === 0 ? <p>No flights shared yet.</p> : trip.flights.map((flight) => (
              <article key={flight.id}>
                <div className="shared-route"><strong>{flight.originCode}</strong><i /><strong>{flight.destinationCode}</strong></div>
                <div><strong>{flight.flightNumber}</strong><span>{flight.airlineName || "Airline not specified"}</span></div>
                <time>{new Date(flight.scheduledDeparture).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time>
                {flight.canRemove && <button disabled={busy} onClick={() => removeFlight(flight.id)} type="button">Remove</button>}
              </article>
            ))}
          </div>
        </section>
      </div>
      {message && <p className="shared-message" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
