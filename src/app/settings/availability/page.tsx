export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PendingActionButton } from "@/components/PendingActionButton";
import { prisma } from "@/lib/db";

export default async function AvailabilitySettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  async function saveAvailability(formData: FormData) {
    "use server";
    const current = await auth();
    if (!current?.user) return;
    const profile = await prisma.profile.findUnique({ where: { userId: current.user.id } });
    if (!profile) return;
    await prisma.userAvailability.create({
      data: {
        profileId: profile.id,
        dayOfWeek: Number(formData.get("dayOfWeek")),
        startTime: String(formData.get("startTime")),
        endTime: String(formData.get("endTime")),
        timeZone: String(formData.get("timeZone"))
      }
    });
  }
  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id }, include: { availabilitySlots: true } });
  return (
    <div className="container grid gap-6 py-8">
      <section className="panel grid gap-4 p-6">
        <h1 className="text-3xl font-black">Availability</h1>
        <form action={saveAvailability} className="grid-auto">
          <label className="field">
            <span>Day</span>
            <select className="input" name="dayOfWeek"><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select>
          </label>
          <label className="field"><span>Start</span><input className="input" name="startTime" type="time" required /></label>
          <label className="field"><span>End</span><input className="input" name="endTime" type="time" required /></label>
          <label className="field"><span>Time zone</span><input className="input" name="timeZone" defaultValue={profile?.timeZone ?? "America/New_York"} /></label>
          <PendingActionButton pendingLabel="Adding...">Add slot</PendingActionButton>
        </form>
      </section>
      <section className="panel p-6">
        {profile?.availabilitySlots.length ? profile.availabilitySlots.map((slot) => (
          <p className="border-b border-[var(--line)] py-2" key={slot.id}>Day {slot.dayOfWeek}: {slot.startTime}-{slot.endTime} {slot.timeZone}</p>
        )) : <p className="muted">No detailed availability slots yet.</p>}
      </section>
    </div>
  );
}
