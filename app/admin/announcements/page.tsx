import Link from "next/link";
import {
  Archive,
  BellRing,
  Clock,
  Megaphone,
  Pencil,
  Plus,
  Send,
  XCircle,
} from "lucide-react";
import {
  HeroPanel,
  MetricCard,
  PageFrame,
  SectionHeader,
  SurfaceCard,
  SurfaceInset,
} from "@/components/monastic-ui";
import { AppActionBar } from "@/components/page-actions";
import { Button } from "@/components/ui/button";
import {
  archiveAnnouncementAction,
  cancelAnnouncementPushScheduleAction,
  createAnnouncementAction,
  publishAnnouncementAction,
  scheduleAnnouncementPushAction,
  sendAnnouncementPushAction,
  updateAnnouncementAction,
} from "@/app/admin/announcements/actions";
import {
  adminListAnnouncements,
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_CATEGORIES,
  ANNOUNCEMENT_STATUSES,
  formatAnnouncementDate,
  formatAnnouncementLabel,
  slugifyAnnouncement,
  type Announcement,
} from "@/lib/announcements";
import { requireAdminUser } from "@/lib/admin-auth";
import {
  listAnnouncementPushSchedules,
  type AnnouncementPushSchedule,
} from "@/lib/push/announcement-broadcasts";
import { createAdminClient } from "@/lib/supabase/admin";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const fieldClassName = "monastic-field";
const labelClassName = "text-sm font-medium text-monastic-1";
const checkboxClassName = "monastic-checkbox";

function getSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

function formatAdminDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isCurrentlyVisibleAnnouncement(announcement: Announcement) {
  const now = Date.now();
  const publishedAt = announcement.published_at
    ? new Date(announcement.published_at).getTime()
    : Number.NaN;
  const expiresAt = announcement.expires_at
    ? new Date(announcement.expires_at).getTime()
    : null;

  return (
    announcement.status === "published" &&
    Number.isFinite(publishedAt) &&
    publishedAt <= now &&
    (expiresAt === null || (Number.isFinite(expiresAt) && expiresAt > now))
  );
}

function StatusNotice({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const error = getSearchParam(searchParams, "error");

  if (error) {
    return (
      <div className="rounded-[1rem] border border-red-700/40 bg-red-950/20 px-4 py-3 text-sm leading-6 text-red-100">
        {error}
      </div>
    );
  }

  let message: string | null = null;

  if (getSearchParam(searchParams, "created") === "1") {
    message = "Announcement created.";
  } else if (getSearchParam(searchParams, "updated") === "1") {
    message = "Announcement updated.";
  } else if (getSearchParam(searchParams, "published") === "1") {
    message = "Announcement published.";
  } else if (getSearchParam(searchParams, "archived") === "1") {
    message = "Announcement archived.";
  } else if (getSearchParam(searchParams, "scheduled") === "1") {
    message = "Push scheduled.";
  } else if (getSearchParam(searchParams, "canceled") === "1") {
    message = "Scheduled push canceled.";
  } else if (getSearchParam(searchParams, "push") === "none") {
    message = "No active push subscriptions matched this audience.";
  } else if (getSearchParam(searchParams, "push") === "sent") {
    message = `Push sent: ${getSearchParam(searchParams, "succeeded") ?? "0"} delivered, ${getSearchParam(searchParams, "failed") ?? "0"} failed, ${getSearchParam(searchParams, "revoked") ?? "0"} revoked.`;
  }

  if (!message) {
    return null;
  }

  return (
    <div className="rounded-[1rem] border border-emerald-700/40 bg-emerald-950/20 px-4 py-3 text-sm leading-6 text-emerald-100">
      {message}
    </div>
  );
}

function ScheduleRows({
  schedules,
}: {
  schedules: AnnouncementPushSchedule[];
}) {
  if (schedules.length === 0) {
    return (
      <p className="mt-3 text-sm leading-6 text-monastic-1">
        No scheduled pushes for this announcement.
      </p>
    );
  }

  return (
    <div className="mt-3 divide-y divide-[color:var(--line-soft)] border-y border-[color:var(--line-soft)]">
      {schedules.map((schedule) => (
        <div
          key={schedule.id}
          className="grid gap-3 py-3 lg:grid-cols-[1fr_auto] lg:items-center"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-monastic-0">
              {formatAdminDateTime(schedule.scheduled_for)}
            </p>
            <p className="mt-1 text-xs leading-5 text-monastic-1">
              {formatAnnouncementLabel(schedule.status)}
              {schedule.sent_at ? ` / Sent ${formatAdminDateTime(schedule.sent_at)}` : ""}
              {" / "}
              {schedule.success_count} delivered, {schedule.failure_count} failed,{" "}
              {schedule.revoked_count} revoked
            </p>
            {schedule.error_message ? (
              <p className="mt-1 text-xs leading-5 text-red-200">
                {schedule.error_message}
              </p>
            ) : null}
          </div>

          {schedule.status === "pending" ? (
            <form action={cancelAnnouncementPushScheduleAction}>
              <input type="hidden" name="schedule_id" value={schedule.id} />
              <Button type="submit" variant="outline" size="sm">
                <XCircle aria-hidden="true" />
                Cancel
              </Button>
            </form>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function AnnouncementFields({
  announcement,
}: {
  announcement?: Announcement;
}) {
  const suggestedSlug = announcement?.slug ?? "";

  return (
    <div className="grid gap-4">
      {announcement ? (
        <input type="hidden" name="id" value={announcement.id} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor={`title-${announcement?.id ?? "new"}`} className={labelClassName}>
            Title
          </label>
          <input
            id={`title-${announcement?.id ?? "new"}`}
            name="title"
            type="text"
            required
            defaultValue={announcement?.title ?? ""}
            className={fieldClassName}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor={`slug-${announcement?.id ?? "new"}`} className={labelClassName}>
            Slug
          </label>
          <input
            id={`slug-${announcement?.id ?? "new"}`}
            name="slug"
            type="text"
            required
            defaultValue={suggestedSlug}
            placeholder={slugifyAnnouncement("Announcement Title")}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-2">
          <label htmlFor={`category-${announcement?.id ?? "new"}`} className={labelClassName}>
            Category
          </label>
          <select
            id={`category-${announcement?.id ?? "new"}`}
            name="category"
            defaultValue={announcement?.category ?? "general"}
            className={fieldClassName}
          >
            {ANNOUNCEMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {formatAnnouncementLabel(category)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor={`audience-${announcement?.id ?? "new"}`} className={labelClassName}>
            Audience
          </label>
          <select
            id={`audience-${announcement?.id ?? "new"}`}
            name="audience"
            defaultValue={announcement?.audience ?? "all"}
            className={fieldClassName}
          >
            {ANNOUNCEMENT_AUDIENCES.map((audience) => (
              <option key={audience} value={audience}>
                {formatAnnouncementLabel(audience)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor={`status-${announcement?.id ?? "new"}`} className={labelClassName}>
            Status
          </label>
          <select
            id={`status-${announcement?.id ?? "new"}`}
            name="status"
            defaultValue={announcement?.status ?? "draft"}
            className={fieldClassName}
          >
            {ANNOUNCEMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatAnnouncementLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-monastic-1">
        <input
          type="checkbox"
          name="is_pinned"
          defaultChecked={announcement?.is_pinned ?? false}
          className={checkboxClassName}
        />
        Pinned
      </label>

      <div className="grid gap-2">
        <label htmlFor={`summary-${announcement?.id ?? "new"}`} className={labelClassName}>
          Summary
        </label>
        <textarea
          id={`summary-${announcement?.id ?? "new"}`}
          name="summary"
          rows={2}
          maxLength={500}
          defaultValue={announcement?.summary ?? ""}
          className={`${fieldClassName} min-h-24`}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor={`body-${announcement?.id ?? "new"}`} className={labelClassName}>
          Body
        </label>
        <textarea
          id={`body-${announcement?.id ?? "new"}`}
          name="body"
          rows={7}
          required
          defaultValue={announcement?.body ?? ""}
          className={`${fieldClassName} min-h-48`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor={`published-at-${announcement?.id ?? "new"}`} className={labelClassName}>
            Published At
          </label>
          <input
            id={`published-at-${announcement?.id ?? "new"}`}
            name="published_at"
            type="datetime-local"
            defaultValue={toDateTimeLocal(announcement?.published_at ?? null)}
            className={fieldClassName}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor={`expires-at-${announcement?.id ?? "new"}`} className={labelClassName}>
            Expires At
          </label>
          <input
            id={`expires-at-${announcement?.id ?? "new"}`}
            name="expires_at"
            type="datetime-local"
            defaultValue={toDateTimeLocal(announcement?.expires_at ?? null)}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor={`cta-label-${announcement?.id ?? "new"}`} className={labelClassName}>
            CTA Label
          </label>
          <input
            id={`cta-label-${announcement?.id ?? "new"}`}
            name="cta_label"
            type="text"
            defaultValue={announcement?.cta_label ?? ""}
            className={fieldClassName}
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor={`cta-href-${announcement?.id ?? "new"}`} className={labelClassName}>
            CTA Href
          </label>
          <input
            id={`cta-href-${announcement?.id ?? "new"}`}
            name="cta_href"
            type="text"
            placeholder="/today"
            defaultValue={announcement?.cta_href ?? ""}
            className={fieldClassName}
          />
        </div>
      </div>
    </div>
  );
}

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdminUser();
  const resolvedSearchParams = await searchParams;
  const admin = createAdminClient();
  const announcements = await adminListAnnouncements(admin);
  const schedules = await listAnnouncementPushSchedules(admin);
  const schedulesByAnnouncementId = new Map<string, AnnouncementPushSchedule[]>();

  for (const schedule of schedules) {
    const existing = schedulesByAnnouncementId.get(schedule.announcement_id) ?? [];
    existing.push(schedule);
    schedulesByAnnouncementId.set(schedule.announcement_id, existing);
  }

  return (
    <main className="monastic-page">
      <PageFrame className="space-y-6">
        <HeroPanel className="py-7 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="text-[#f7ebd8]">
              <p className="section-kicker text-[#ead6b0]">Admin</p>
              <h1 className="mt-3 text-5xl font-semibold sm:text-6xl">
                Announcements
              </h1>
              <p className="mt-3 text-lg leading-8 text-[#ead8bc]">
                Official updates shown only to signed-in members.
              </p>
            </div>

            <AppActionBar
              className="grid gap-3 border-white/10 bg-[rgba(22,16,13,0.28)] sm:grid-cols-3"
              actions={[
                { href: "/dashboard", label: "Dashboard", variant: "secondary" },
                { href: "/announcements", label: "View List", variant: "secondary" },
                { href: "/admin/support", label: "Support", variant: "outline" },
              ]}
            />
          </div>
        </HeroPanel>

        <StatusNotice searchParams={resolvedSearchParams} />

        <SurfaceCard className="py-4">
          <p className="text-sm leading-6 text-monastic-1">
            Weekly Recaps are generated by the protected Sunday cron route and
            sent as announcement push notifications when created.
          </p>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total"
            value={`${announcements.length}`}
            detail="All announcement records."
          />
          <MetricCard
            label="Published"
            value={`${announcements.filter((item) => item.status === "published").length}`}
            detail="Currently marked published."
          />
          <MetricCard
            label="Pinned"
            value={`${announcements.filter((item) => item.is_pinned).length}`}
            detail="Pinned items show first."
          />
        </div>

        <SurfaceCard>
          <SectionHeader
            kicker="Create"
            title="New Announcement"
            description="Write plain text. Blank lines become paragraphs."
          />
          <form action={createAnnouncementAction} className="mt-5 space-y-5">
            <AnnouncementFields />
            <Button type="submit">
              <Plus aria-hidden="true" />
              Create Announcement
            </Button>
          </form>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader
            kicker="List"
            title="All Announcements"
            description="Edit, publish, or archive existing updates."
          />

          {announcements.length === 0 ? (
            <p className="mt-5 text-sm leading-6 text-monastic-1">
              No announcements have been created yet.
            </p>
          ) : (
            <div className="mt-5 space-y-5">
              {announcements.map((announcement) => {
                const canSendPush = isCurrentlyVisibleAnnouncement(announcement);
                const announcementSchedules =
                  schedulesByAnnouncementId.get(announcement.id) ?? [];
                const hasPendingSchedule = announcementSchedules.some(
                  (schedule) => schedule.status === "pending"
                );

                return (
                  <SurfaceInset key={announcement.id}>
                    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="section-kicker">
                          {formatAnnouncementLabel(announcement.status)} /{" "}
                          {formatAnnouncementLabel(announcement.audience)} /{" "}
                          {formatAnnouncementLabel(announcement.category)}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-monastic-0">
                          {announcement.title}
                        </h2>
                        <p className="mt-2 text-sm text-monastic-1">
                          Published: {formatAnnouncementDate(announcement.published_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {canSendPush ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/announcements/${announcement.slug}`}>
                              <Megaphone aria-hidden="true" />
                              View
                            </Link>
                          </Button>
                        ) : null}

                        {canSendPush ? (
                          <form action={sendAnnouncementPushAction}>
                            <input type="hidden" name="id" value={announcement.id} />
                            <Button type="submit" variant="primary" size="sm">
                              <BellRing aria-hidden="true" />
                              Send Push
                            </Button>
                          </form>
                        ) : null}

                        <form action={publishAnnouncementAction}>
                          <input type="hidden" name="id" value={announcement.id} />
                          <Button type="submit" variant="secondary" size="sm">
                            <Send aria-hidden="true" />
                            Publish
                          </Button>
                        </form>

                        <form action={archiveAnnouncementAction}>
                          <input type="hidden" name="id" value={announcement.id} />
                          <Button type="submit" variant="outline" size="sm">
                            <Archive aria-hidden="true" />
                            Archive
                          </Button>
                        </form>
                      </div>
                    </div>

                  {canSendPush && !hasPendingSchedule ? (
                    <form
                      action={scheduleAnnouncementPushAction}
                      className="mb-5 grid gap-3 border-y border-[color:var(--line-soft)] py-4 sm:grid-cols-[1fr_auto] sm:items-end"
                    >
                      <input type="hidden" name="id" value={announcement.id} />
                      <div className="grid gap-2">
                        <label
                          htmlFor={`scheduled-for-${announcement.id}`}
                          className={labelClassName}
                        >
                          Schedule Push At
                        </label>
                        <input
                          id={`scheduled-for-${announcement.id}`}
                          name="scheduled_for"
                          type="datetime-local"
                          required
                          className={fieldClassName}
                        />
                      </div>
                      <Button type="submit" variant="outline" size="sm">
                        <Clock aria-hidden="true" />
                        Schedule Push
                      </Button>
                    </form>
                  ) : canSendPush ? (
                    <div className="mb-5 border-y border-[color:var(--line-soft)] py-4">
                      <p className="text-sm leading-6 text-monastic-1">
                        A push is already scheduled for this announcement. Cancel
                        the pending schedule before adding another.
                      </p>
                    </div>
                  ) : null}

                  <div className="mb-5">
                    <div className="section-kicker">Scheduled Pushes</div>
                    <ScheduleRows schedules={announcementSchedules} />
                  </div>

                  <form action={updateAnnouncementAction} className="space-y-5">
                    <AnnouncementFields announcement={announcement} />
                    <Button type="submit" variant="secondary">
                      <Pencil aria-hidden="true" />
                      Save Changes
                    </Button>
                  </form>
                  </SurfaceInset>
                );
              })}
            </div>
          )}
        </SurfaceCard>
      </PageFrame>
    </main>
  );
}
