"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { SharedTripView, SharedFlight } from "@/lib/shared-trips";

type APIResult = { error?: string; trips?: SharedTripView[]; trip?: { id: string }; invite?: { url: string; expiresAt: string }; flight?: SharedFlight };

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
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      apiRequest("/api/shared-trips", "GET").then(result => {
        if (active) setTrips(result.trips || []);
      }).catch(() => { if (active) setError("Could not refresh shared trips. Reload to try again."); });
    }, 30000);
    return () => { active = false; window.clearInterval(timer); };
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
    <section aria-busy={loading || creating} className="shared-trips-card" id="shared-trips">
      <div className="shared-trips-heading">
        <div>
          <p className="eyebrow">AERO ID SHARING</p>
          <h2>Shared trips</h2>
          <p>Share selected flight details with people you invite. Every member sees shared flights.</p>
        </div>
        <span>{trips.length.toString().padStart(2, "0")} TRIPS</span>
      </div>

      <form className="shared-trip-create" onSubmit={createTrip}>
        <label>Trip name<input autoComplete="off" name="tripName" required maxLength={120} placeholder="Summer in Lisbon" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Starts<input name="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>Ends<input min={startDate || undefined} name="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        <button className="button primary" disabled={creating} type="submit">{creating ? "Creating trip..." : "Create shared trip"}</button>
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <p className="shared-empty" role="status">Loading shared trips...</p> : trips.length === 0 ? (
        <p className="shared-empty">No shared trips yet. Create one above, then invite another Aero ID.</p>
      ) : (
        <>
          <details className="all-shared-flights" open>
            <summary>All shared flights</summary>
            {trips.flatMap(trip => trip.flights.map(flight => <div key={`${trip.id}:${flight.id}`}><h3>{trip.name}</h3><SharedFlightCard flight={flight} tripID={trip.id} /></div>))}
          </details>
          <div aria-label="Choose a shared trip" className="trip-switcher" role="group">
            {trips.map((trip) => (
              <button aria-pressed={trip.id === selectedID} className={trip.id === selectedID ? "active" : ""} key={trip.id} onClick={() => setSelectedID(trip.id)} type="button">
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
  const [sharing, setSharing] = useState(false);
  const [level, setLevel] = useState(0);
  const sharingDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (sharing) sharingDialog.current?.showModal(); }, [sharing]);
  const [details, setDetails] = useState<Record<string, string>>({});
  const levelNames = ["Basics", "Some detail", "Everything"];
  const levelValues = ["basics", "details", "everything"];
  const detailFields = ["status", "aircraft", "registration", "terminal", "gate", "arrivalTerminal", "arrivalGate", "baggageClaim"];
  const fieldLabels: Record<string, string> = { status: "Status", aircraft: "Aircraft", registration: "Registration", terminal: "Departure terminal", gate: "Departure gate", arrivalTerminal: "Arrival terminal", arrivalGate: "Arrival gate", baggageClaim: "Baggage carousel", seat: "Seat", confirmationCode: "Booking reference", notes: "Notes" };
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

  function copyInvite() {
    void run(async () => {
      await navigator.clipboard.writeText(inviteURL);
      setMessage("Invite copied.");
    });
  }

  function addFlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const content = level === 0 ? {} : Object.fromEntries(Object.entries(details).filter(([key]) => level === 2 || detailFields.includes(key)));
      const result = await apiRequest(`/api/shared-trips/${trip.id}/flights`, "POST", {
        flightNumber, airlineName: airlineName || undefined, originCode, destinationCode,
        scheduledDeparture: new Date(departure).toISOString(),
        scheduledArrival: arrival ? new Date(arrival).toISOString() : undefined,
        sharingLevel: levelValues[level], details: content,
      });
      if (!result.flight) throw new Error("The server did not return the shared flight.");
      setSharing(false); setDetails({}); setLevel(0);
      setFlightNumber("");
      setAirlineName("");
      setOriginCode("");
      setDestinationCode("");
      setDeparture("");
      setArrival("");
      setMessage("Flight shared with every trip member.");
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
    <div aria-busy={busy} className="trip-workspace">
      <div className="trip-summary">
        <div><span>ROLE</span><strong>{trip.role}</strong></div>
        <div><span>DATES</span><strong>{trip.startDate || "Open"} / {trip.endDate || "Open"}</strong></div>
        <div><span>VERSION</span><strong>{trip.version}</strong></div>
      </div>

      {trip.canManage && (
        <form className="trip-edit-form" onSubmit={saveTrip}>
          <label>Name<input autoComplete="off" name="tripName" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Starts<input name="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label>Ends<input min={startDate || undefined} name="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <button disabled={busy} type="submit">Save details</button>
        </form>
      )}

      <div className="sharing-grid">
        <section className="trip-members">
          <div className="shared-subheading"><h3>Members</h3>{trip.canManage && <button disabled={busy} onClick={createInvite} type="button">Create invite</button>}</div>
          {inviteURL && (
            <div className="invite-output">
              <input aria-label="Invite link" readOnly value={inviteURL} />
              <button onClick={copyInvite} type="button">Copy</button>
            </div>
          )}
          <div className="member-list">
            {trip.members.map((member) => (
              <div className="member-row" key={member.id}>
                <span aria-hidden="true" className="member-avatar">{(member.displayName || member.username).slice(0, 2).toUpperCase()}</span>
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
          <div className="shared-flight-list">
            {trip.flights.length === 0 ? <p>No flights shared yet.</p> : trip.flights.map((flight) => (
              <SharedFlightCard key={flight.id} flight={flight} tripID={trip.id}>
                {flight.canRemove && <button disabled={busy} onClick={() => removeFlight(flight.id)} type="button">Remove</button>}
              </SharedFlightCard>
            ))}
          </div>
          <form className="flight-share-form" onSubmit={(event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            setDeparture(String(values.get("departure") || ""));
            setArrival(String(values.get("arrival") || ""));
            setSharing(true); setError(null);
          }}>
            <input aria-label="Flight number" autoCapitalize="characters" autoComplete="off" maxLength={16} name="flightNumber" placeholder="Flight, e.g. UA901" required value={flightNumber} onChange={(event) => setFlightNumber(event.target.value.toUpperCase())} />
            <input aria-label="Airline" autoComplete="off" maxLength={100} name="airlineName" placeholder="Airline (optional)" value={airlineName} onChange={(event) => setAirlineName(event.target.value)} />
            <input aria-label="Origin airport" autoCapitalize="characters" autoComplete="off" maxLength={3} name="originCode" pattern="[A-Za-z]{3}" placeholder="SFO" required value={originCode} onChange={(event) => setOriginCode(event.target.value.toUpperCase())} />
            <input aria-label="Destination airport" autoCapitalize="characters" autoComplete="off" maxLength={3} name="destinationCode" pattern="[A-Za-z]{3}" placeholder="LHR" required value={destinationCode} onChange={(event) => setDestinationCode(event.target.value.toUpperCase())} />
            <label>Departure<input name="departure" required type="datetime-local" value={departure} onChange={(event) => setDeparture(event.target.value)} /></label>
            <label>Arrival <span>optional</span><input min={departure || undefined} name="arrival" type="datetime-local" value={arrival} onChange={(event) => setArrival(event.target.value)} /></label>
            <button disabled={busy} type="submit">Choose what to share</button>
          </form>
        </section>
      </div>
      {sharing && (
        <div className="share-modal-backdrop">
          <dialog ref={sharingDialog} aria-labelledby="share-title" className="share-modal" onCancel={event => { if (busy) event.preventDefault(); else setSharing(false); }}>
            <h3 id="share-title">What would you like to share?</h3>
            <p>{flightNumber} · {originCode}–{destinationCode} · All members of {trip.name}</p>
            <form onSubmit={addFlight}>
              <label htmlFor="sharing-level">{levelNames[level]}</label>
              <input autoFocus id="sharing-level" type="range" min={0} max={2} step={1} value={level} aria-valuetext={levelNames[level]} disabled={busy} onChange={e => setLevel(Number(e.target.value))} />
              <div className="share-levels">{levelNames.map((name, index) => <button type="button" disabled={busy} aria-pressed={level === index} key={name} onClick={() => setLevel(index)}>{name}</button>)}</div>
              <p>{level === 0 ? "Flight number, airline, route and scheduled times." : level === 1 ? "Basics plus status, aircraft, terminals, gates and baggage details." : "Some detail plus seat, booking reference and text notes. Documents, photos, files and account credentials are never shared."}</p>
              {level > 0 && <div className="flight-share-form">{[...detailFields, ...(level === 2 ? ["seat", "confirmationCode", "notes"] : [])].map(key => <label key={key}>{fieldLabels[key]}<input maxLength={key === "notes" ? 20000 : key === "aircraft" ? 120 : key === "confirmationCode" ? 100 : 40} value={details[key] || ""} disabled={busy} onChange={e => setDetails({...details, [key]: e.target.value})} /></label>)}</div>}
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="share-actions"><button type="button" disabled={busy} onClick={() => setSharing(false)}>Cancel</button><button className="button primary" disabled={busy} type="submit">{busy ? "Sharing…" : `Share ${levelNames[level].toLowerCase()}`}</button></div>
            </form>
          </dialog>
        </div>
      )}
      {message && <p className="shared-message" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}

function SharedFlightCard({ flight, tripID, children }: { flight: SharedFlight; tripID: string; children?: React.ReactNode }) {
  const labels: Record<string, string> = { status: "Status", estimatedDeparture: "Estimated departure", estimatedArrival: "Estimated arrival", aircraft: "Aircraft", registration: "Registration", terminal: "Departure terminal", gate: "Departure gate", arrivalTerminal: "Arrival terminal", arrivalGate: "Arrival gate", baggageClaim: "Baggage", seat: "Seat", confirmationCode: "Booking reference", notes: "Notes" };
  return <article className="shared-flight-card">
    <div className="shared-route"><strong>{flight.originCode}</strong><i /><strong>{flight.destinationCode}</strong></div>
    <div><strong>{flight.flightNumber}</strong><span>{flight.airlineName || ""}</span></div>
    <time>{new Date(flight.scheduledDeparture).toLocaleString()}</time>
    {flight.scheduledArrival && <p>Arrival: {new Date(flight.scheduledArrival).toLocaleString()}</p>}
    <p>{flight.sharingLevel === "everything" ? "Everything" : flight.sharingLevel === "details" ? "Some detail" : "Basics"} · Shared by {flight.addedBy?.displayName || flight.addedBy?.username || "a trip member"}</p>
    {Object.entries(flight.details || {}).filter(([key, value]) => key !== "timelineNotes" && value).map(([key, value]) => <p key={key}><strong>{labels[key] || key}: </strong>{String(value)}</p>)}
    {flight.details?.timelineNotes?.map((note, index) => <p key={index}>{note.text} <small>{new Date(note.createdAt).toLocaleString()}</small></p>)}
    {children}
  </article>;
}
