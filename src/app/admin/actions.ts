"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-auth";

const ADMIN_ROLES = ["super_admin", "match_official", "media_officer"] as const;
type AdminRole = (typeof ADMIN_ROLES)[number];

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login?error=Please sign in first");
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (adminError || !adminRow) {
    redirect("/admin/login?error=You are not an admin user");
  }

  return { supabase, user };
}

async function requireSuperAdmin() {
  const { supabase, user } = await requireAdmin();

  const { data, error } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  // Backwards compatibility: if role column does not exist yet, allow existing admins.
  if (error && ["42703", "PGRST204"].includes(error.code ?? "")) {
    return { supabase, user };
  }

  if (error) {
    redirect(`/admin?section=access&error=${encodeURIComponent(error.message)}`);
  }

  if ((data as { role?: string } | null)?.role && (data as { role?: string }).role !== "super_admin") {
    redirect("/admin?section=access&error=Only super admins can manage admin access");
  }

  return { supabase, user };
}

function revalidateLeagueViews() {
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/table");
  revalidatePath("/teams");
  revalidatePath("/scorers");
  revalidatePath("/news");
  revalidatePath("/admin");
}

async function getActiveSeasonId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const { data, error } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data?.id ?? null;
}

async function logAdminEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  actionType: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>,
) {
  await supabase.from("admin_activity_logs").insert({
    actor_user_id: userId,
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: details ?? null,
  });
}

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=Email and password are required");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createSeason(formData: FormData) {
  const { supabase, user } = await requireSuperAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const startDateRaw = String(formData.get("start_date") ?? "").trim();
  const endDateRaw = String(formData.get("end_date") ?? "").trim();
  const makeActive = String(formData.get("make_active") ?? "") === "on";

  if (!name) {
    redirect("/admin?section=seasons&error=Season name is required");
  }

  if (makeActive) {
    await supabase.from("seasons").update({ is_active: false }).eq("is_active", true);
  }

  const { data, error } = await supabase
    .from("seasons")
    .insert({
      name,
      start_date: startDateRaw || null,
      end_date: endDateRaw || null,
      is_active: makeActive,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/admin?section=seasons&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "create", "season", String(data?.id ?? ""), {
    name,
    makeActive,
  });

  revalidateLeagueViews();
  redirect("/admin?section=seasons&success=Season created");
}

export async function setActiveSeason(formData: FormData) {
  const { supabase, user } = await requireSuperAdmin();

  const seasonId = Number(formData.get("season_id"));
  if (!Number.isFinite(seasonId)) {
    redirect("/admin?section=seasons&error=Invalid season selected");
  }

  const { error: clearError } = await supabase.from("seasons").update({ is_active: false }).eq("is_active", true);
  if (clearError) {
    redirect(`/admin?section=seasons&error=${encodeURIComponent(clearError.message)}`);
  }

  const { error } = await supabase.from("seasons").update({ is_active: true }).eq("id", seasonId);
  if (error) {
    redirect(`/admin?section=seasons&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "activate", "season", String(seasonId));

  revalidateLeagueViews();
  redirect("/admin?section=seasons&success=Active season updated");
}

export async function updateMatchResult(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const matchId = Number(formData.get("match_id"));
  const status = String(formData.get("status") ?? "scheduled");
  const homeScoreRaw = String(formData.get("home_score") ?? "");
  const awayScoreRaw = String(formData.get("away_score") ?? "");
  const liveMinuteRaw = String(formData.get("live_minute") ?? "");
  const statusNoteRaw = String(formData.get("status_note") ?? "").trim();

  const homeScore = homeScoreRaw === "" ? null : Number(homeScoreRaw);
  const awayScore = awayScoreRaw === "" ? null : Number(awayScoreRaw);
  const liveMinute = liveMinuteRaw === "" ? null : Number(liveMinuteRaw);

  if (!Number.isFinite(matchId)) {
    redirect("/admin?section=matches&error=Invalid match selected");
  }

  const { error } = await supabase
    .from("matches")
    .update({
      status,
      home_score: homeScore,
      away_score: awayScore,
      live_minute: liveMinute,
      status_note: statusNoteRaw || null,
    })
    .eq("id", matchId);

  if (error) {
    redirect(`/admin?section=matches&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "update", "match", String(matchId), {
    status,
    homeScore,
    awayScore,
    liveMinute,
    statusNote: statusNoteRaw || null,
  });

  revalidateLeagueViews();
  redirect("/admin?section=matches&success=Match updated");
}

export async function deleteMatch(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const matchId = Number(formData.get("match_id"));

  if (!Number.isFinite(matchId)) {
    redirect("/admin?section=matches&error=Invalid match selected");
  }

  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) {
    redirect(`/admin?section=matches&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "delete", "match", String(matchId));

  revalidateLeagueViews();
  redirect("/admin?section=matches&success=Match deleted");
}

export async function createNewsPost(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const snippet = String(formData.get("snippet") ?? "").trim();

  if (!title || !snippet) {
    redirect("/admin?section=news&error=Title and snippet are required");
  }

  const { data, error } = await supabase.from("news").insert({ title, snippet }).select("id").single();

  if (error) {
    redirect(`/admin?section=news&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "create", "news", String(data?.id ?? ""), { title });

  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin");
  redirect("/admin?section=news&success=News published");
}

export async function updateNewsPost(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const newsId = Number(formData.get("news_id"));
  const title = String(formData.get("title") ?? "").trim();
  const snippet = String(formData.get("snippet") ?? "").trim();

  if (!Number.isFinite(newsId)) {
    redirect("/admin?section=news&error=Invalid news item");
  }
  if (!title || !snippet) {
    redirect("/admin?section=news&error=Title and snippet are required");
  }

  const { error } = await supabase
    .from("news")
    .update({ title, snippet })
    .eq("id", newsId);

  if (error) {
    redirect(`/admin?section=news&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "update", "news", String(newsId), { title });

  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin");
  redirect("/admin?section=news&success=News updated");
}

export async function deleteNewsPost(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const newsId = Number(formData.get("news_id"));
  if (!Number.isFinite(newsId)) {
    redirect("/admin?section=news&error=Invalid news item");
  }

  const { error } = await supabase.from("news").delete().eq("id", newsId);
  if (error) {
    redirect(`/admin?section=news&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "delete", "news", String(newsId));

  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin");
  redirect("/admin?section=news&success=News deleted");
}

export async function createTeam(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const shortNameRaw = String(formData.get("short_name") ?? "").trim();

  if (!name) {
    redirect("/admin?section=teams-players&error=Team name is required");
  }

  const short_name = shortNameRaw === "" ? null : shortNameRaw.toUpperCase();

  const { error } = await supabase
    .from("teams")
    .upsert({ name, short_name }, { onConflict: "name" });

  if (error) {
    redirect(`/admin?section=teams-players&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "upsert", "team", undefined, { name, short_name });

  revalidateLeagueViews();
  redirect("/admin?section=teams-players&success=Team saved");
}

export async function deleteTeam(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const teamId = Number(formData.get("team_id"));

  if (!Number.isFinite(teamId)) {
    redirect("/admin?section=teams-players&error=Invalid team selected");
  }

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    redirect(`/admin?section=teams-players&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "delete", "team", String(teamId));

  revalidateLeagueViews();
  redirect("/admin?section=teams-players&success=Team deleted");
}

export async function createPlayer(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const teamId = Number(formData.get("team_id"));
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const shirtRaw = String(formData.get("shirt_number") ?? "").trim();
  const positionRaw = String(formData.get("position") ?? "").trim();
  const goalsRaw = String(formData.get("goals") ?? "").trim();
  const assistsRaw = String(formData.get("assists") ?? "").trim();

  if (!Number.isFinite(teamId)) {
    redirect("/admin?section=teams-players&error=Select a valid team");
  }
  if (!firstName || !lastName) {
    redirect("/admin?section=teams-players&error=First name and last name are required");
  }

  const shirt_number = shirtRaw === "" ? null : Number(shirtRaw);
  const position = positionRaw === "" ? null : positionRaw;
  const goals = goalsRaw === "" ? 0 : Number(goalsRaw);
  const assists = assistsRaw === "" ? 0 : Number(assistsRaw);

  const { data: player, error: playerError } = await supabase
    .from("players")
    .upsert(
      {
        team_id: teamId,
        first_name: firstName,
        last_name: lastName,
        shirt_number,
        position,
      },
      { onConflict: "team_id,first_name,last_name" },
    )
    .select("id")
    .single();

  if (playerError || !player) {
    redirect(`/admin?section=teams-players&error=${encodeURIComponent(playerError?.message ?? "Could not save player")}`);
  }

  const { error: statsError } = await supabase.from("player_stats").upsert(
    {
      player_id: player.id,
      goals: Number.isFinite(goals) ? goals : 0,
      assists: Number.isFinite(assists) ? assists : 0,
    },
    { onConflict: "player_id" },
  );

  if (statsError) {
    redirect(`/admin?section=teams-players&error=${encodeURIComponent(statsError.message)}`);
  }

  await logAdminEvent(supabase, user.id, "upsert", "player", String(player.id), {
    teamId,
    firstName,
    lastName,
    goals,
    assists,
  });

  revalidateLeagueViews();
  redirect("/admin?section=teams-players&success=Player saved");
}

export async function deletePlayer(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const playerId = Number(formData.get("player_id"));

  if (!Number.isFinite(playerId)) {
    redirect("/admin?section=teams-players&error=Invalid player selected");
  }

  const { error } = await supabase.from("players").delete().eq("id", playerId);
  if (error) {
    redirect(`/admin?section=teams-players&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "delete", "player", String(playerId));

  revalidateLeagueViews();
  redirect("/admin?section=teams-players&success=Player deleted");
}

export async function transferPlayer(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const playerId = Number(formData.get("player_id"));
  const toTeamId = Number(formData.get("to_team_id"));
  const transferReasonRaw = String(formData.get("transfer_reason") ?? "").trim();
  const transferReason = transferReasonRaw === "" ? null : transferReasonRaw;

  if (!Number.isFinite(playerId) || !Number.isFinite(toTeamId)) {
    redirect("/admin?section=teams-players&error=Invalid player transfer request");
  }

  const { data: existingPlayer, error: playerError } = await supabase
    .from("players")
    .select("id, team_id, first_name, last_name")
    .eq("id", playerId)
    .single();

  if (playerError || !existingPlayer) {
    redirect("/admin?section=teams-players&error=Player not found");
  }

  if (existingPlayer.team_id === toTeamId) {
    redirect("/admin?section=teams-players&error=Player is already in that team");
  }

  const { error } = await supabase.from("players").update({ team_id: toTeamId }).eq("id", playerId);
  if (error) {
    redirect(`/admin?section=teams-players&error=${encodeURIComponent(error.message)}`);
  }

  const { error: historyError } = await supabase.from("player_transfers").insert({
    player_id: playerId,
    from_team_id: existingPlayer.team_id,
    to_team_id: toTeamId,
    transfer_reason: transferReason,
    actor_user_id: user.id,
  });

  // Keep transfer flow working even if migration has not been run yet.
  if (historyError && !["42P01", "PGRST205"].includes(historyError.code ?? "")) {
    redirect(`/admin?section=teams-players&error=${encodeURIComponent(historyError.message)}`);
  }

  await logAdminEvent(supabase, user.id, "transfer", "player", String(playerId), {
    fromTeamId: existingPlayer.team_id,
    toTeamId,
    transferReason,
    firstName: existingPlayer.first_name,
    lastName: existingPlayer.last_name,
  });

  revalidateLeagueViews();
  if (historyError && ["42P01", "PGRST205"].includes(historyError.code ?? "")) {
    redirect("/admin?section=teams-players&success=Player transferred (history table not yet enabled)");
  }
  redirect("/admin?section=teams-players&success=Player transferred");
}

export async function createFixture(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const homeTeamId = Number(formData.get("home_team_id"));
  const awayTeamId = Number(formData.get("away_team_id"));
  const matchDate = String(formData.get("match_date") ?? "").trim();
  const venueRaw = String(formData.get("venue") ?? "").trim();
  const status = String(formData.get("status") ?? "scheduled");
  const homeScoreRaw = String(formData.get("home_score") ?? "").trim();
  const awayScoreRaw = String(formData.get("away_score") ?? "").trim();
  const liveMinuteRaw = String(formData.get("live_minute") ?? "").trim();
  const statusNoteRaw = String(formData.get("status_note") ?? "").trim();
  const seasonIdRaw = String(formData.get("season_id") ?? "").trim();

  if (!Number.isFinite(homeTeamId) || !Number.isFinite(awayTeamId)) {
    redirect("/admin?section=matches&error=Select valid home and away teams");
  }
  if (homeTeamId === awayTeamId) {
    redirect("/admin?section=matches&error=Home and away teams must be different");
  }
  if (!matchDate) {
    redirect("/admin?section=matches&error=Match date/time is required");
  }

  const venue = venueRaw === "" ? null : venueRaw;
  const home_score = homeScoreRaw === "" ? null : Number(homeScoreRaw);
  const away_score = awayScoreRaw === "" ? null : Number(awayScoreRaw);
  const live_minute = liveMinuteRaw === "" ? null : Number(liveMinuteRaw);
  const parsedSeasonId = seasonIdRaw === "" ? null : Number(seasonIdRaw);
  const season_id = Number.isFinite(parsedSeasonId) ? parsedSeasonId : await getActiveSeasonId(supabase);

  const { data, error } = await supabase
    .from("matches")
    .insert({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: matchDate,
      venue,
      status,
      home_score,
      away_score,
      live_minute,
      status_note: statusNoteRaw || null,
      season_id,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/admin?section=matches&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "create", "match", String(data?.id ?? ""), {
    homeTeamId,
    awayTeamId,
    matchDate,
    status,
    statusNote: statusNoteRaw || null,
    seasonId: season_id,
  });

  revalidateLeagueViews();
  redirect("/admin?section=matches&success=Fixture created");
}

export async function createMediaAsset(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const mediaUrl = String(formData.get("media_url") ?? "").trim();
  const mediaType = String(formData.get("media_type") ?? "image").trim();
  const captionRaw = String(formData.get("caption") ?? "").trim();
  const seasonIdRaw = String(formData.get("season_id") ?? "").trim();

  if (!title || !mediaUrl) {
    redirect("/admin?section=media&error=Title and media URL are required");
  }

  const parsedSeasonId = seasonIdRaw === "" ? null : Number(seasonIdRaw);
  const season_id = Number.isFinite(parsedSeasonId) ? parsedSeasonId : await getActiveSeasonId(supabase);

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      title,
      media_url: mediaUrl,
      media_type: mediaType,
      caption: captionRaw || null,
      season_id,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/admin?section=media&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "create", "media_asset", String(data?.id ?? ""), {
    title,
    mediaType,
    seasonId: season_id,
  });

  revalidatePath("/admin");
  redirect("/admin?section=media&success=Media asset saved");
}

export async function deleteMediaAsset(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const mediaId = Number(formData.get("media_id"));
  if (!Number.isFinite(mediaId)) {
    redirect("/admin?section=media&error=Invalid media item selected");
  }

  const { error } = await supabase.from("media_assets").delete().eq("id", mediaId);
  if (error) {
    redirect(`/admin?section=media&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "delete", "media_asset", String(mediaId));

  revalidatePath("/admin");
  redirect("/admin?section=media&success=Media asset deleted");
}

async function getMatchOrRedirect(matchIdRaw: FormDataEntryValue | null) {
  const matchId = Number(matchIdRaw);
  if (!Number.isFinite(matchId)) {
    redirect("/admin?section=live&error=Invalid match selected");
  }

  const { supabase, user } = await requireAdmin();
  const { data: match, error } = await supabase
    .from("matches")
    .select("id, status, home_score, away_score, live_minute")
    .eq("id", matchId)
    .single();

  if (error || !match) {
    redirect("/admin?section=live&error=Match not found");
  }

  return { supabase, user, match };
}

export async function startLiveMatch(formData: FormData) {
  const { supabase, user, match } = await getMatchOrRedirect(formData.get("match_id"));

  const { error } = await supabase
    .from("matches")
    .update({
      status: "live",
      home_score: match.home_score ?? 0,
      away_score: match.away_score ?? 0,
      live_minute: match.live_minute ?? 1,
    })
    .eq("id", match.id);

  if (error) redirect(`/admin?section=live&error=${encodeURIComponent(error.message)}`);

  await logAdminEvent(supabase, user.id, "start_live", "match", String(match.id));

  revalidateLeagueViews();
  redirect("/admin?section=live&success=Match started live");
}

export async function addHomeGoal(formData: FormData) {
  const { supabase, user, match } = await getMatchOrRedirect(formData.get("match_id"));
  const { error } = await supabase
    .from("matches")
    .update({
      status: "live",
      home_score: (match.home_score ?? 0) + 1,
      away_score: match.away_score ?? 0,
      live_minute: match.live_minute ?? 1,
    })
    .eq("id", match.id);

  if (error) redirect(`/admin?section=live&error=${encodeURIComponent(error.message)}`);

  await logAdminEvent(supabase, user.id, "home_goal", "match", String(match.id));

  revalidateLeagueViews();
  redirect("/admin?section=live&success=Home goal added");
}

export async function addAwayGoal(formData: FormData) {
  const { supabase, user, match } = await getMatchOrRedirect(formData.get("match_id"));
  const { error } = await supabase
    .from("matches")
    .update({
      status: "live",
      home_score: match.home_score ?? 0,
      away_score: (match.away_score ?? 0) + 1,
      live_minute: match.live_minute ?? 1,
    })
    .eq("id", match.id);

  if (error) redirect(`/admin?section=live&error=${encodeURIComponent(error.message)}`);

  await logAdminEvent(supabase, user.id, "away_goal", "match", String(match.id));

  revalidateLeagueViews();
  redirect("/admin?section=live&success=Away goal added");
}

export async function addMinute(formData: FormData) {
  const { supabase, user, match } = await getMatchOrRedirect(formData.get("match_id"));
  const { error } = await supabase
    .from("matches")
    .update({
      status: "live",
      live_minute: Math.min((match.live_minute ?? 0) + 1, 130),
    })
    .eq("id", match.id);

  if (error) redirect(`/admin?section=live&error=${encodeURIComponent(error.message)}`);

  await logAdminEvent(supabase, user.id, "minute_plus_one", "match", String(match.id));

  revalidateLeagueViews();
  redirect("/admin?section=live&success=Minute updated");
}

export async function finishMatch(formData: FormData) {
  const { supabase, user, match } = await getMatchOrRedirect(formData.get("match_id"));
  const { error } = await supabase
    .from("matches")
    .update({
      status: "finished",
      home_score: match.home_score ?? 0,
      away_score: match.away_score ?? 0,
      live_minute: null,
    })
    .eq("id", match.id);

  if (error) redirect(`/admin?section=live&error=${encodeURIComponent(error.message)}`);

  await logAdminEvent(supabase, user.id, "full_time", "match", String(match.id));

  revalidateLeagueViews();
  redirect("/admin?section=live&success=Match marked full-time");
}

export async function addAdminUser(formData: FormData) {
  const { supabase, user } = await requireSuperAdmin();

  const newUserId = String(formData.get("user_id") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "match_official").trim();

  if (!newUserId) {
    redirect("/admin?section=access&error=User ID is required");
  }

  const role: AdminRole = ADMIN_ROLES.includes(roleRaw as AdminRole)
    ? (roleRaw as AdminRole)
    : "match_official";

  const { error } = await supabase
    .from("admin_users")
    .upsert({ user_id: newUserId, role }, { onConflict: "user_id" });

  if (error && ["42703", "PGRST204"].includes(error.code ?? "")) {
    const { error: fallbackError } = await supabase
      .from("admin_users")
      .upsert({ user_id: newUserId }, { onConflict: "user_id" });

    if (fallbackError) {
      redirect(`/admin?section=access&error=${encodeURIComponent(fallbackError.message)}`);
    }

    revalidatePath("/admin");
    redirect("/admin?section=access&success=Admin added (role support pending SQL migration)");
  }

  if (error) {
    redirect(`/admin?section=access&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "grant_admin", "admin_user", newUserId, { role });

  revalidatePath("/admin");
  redirect("/admin?section=access&success=Admin user saved");
}

export async function updateAdminUserRole(formData: FormData) {
  const { supabase, user } = await requireSuperAdmin();

  const targetUserId = String(formData.get("user_id") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "").trim();

  if (!targetUserId) {
    redirect("/admin?section=access&error=Admin user ID is required");
  }

  if (!ADMIN_ROLES.includes(roleRaw as AdminRole)) {
    redirect("/admin?section=access&error=Invalid role selected");
  }

  const { error } = await supabase
    .from("admin_users")
    .update({ role: roleRaw })
    .eq("user_id", targetUserId);

  if (error) {
    redirect(`/admin?section=access&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "update_role", "admin_user", targetUserId, { role: roleRaw });

  revalidatePath("/admin");
  redirect("/admin?section=access&success=Admin role updated");
}

export async function removeAdminUser(formData: FormData) {
  const { supabase, user } = await requireSuperAdmin();

  const targetUserId = String(formData.get("user_id") ?? "").trim();
  if (!targetUserId) {
    redirect("/admin?section=access&error=Admin user ID is required");
  }

  if (targetUserId === user.id) {
    redirect("/admin?section=access&error=You cannot remove your own admin access");
  }

  const { error } = await supabase.from("admin_users").delete().eq("user_id", targetUserId);

  if (error) {
    redirect(`/admin?section=access&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminEvent(supabase, user.id, "remove_admin", "admin_user", targetUserId);

  revalidatePath("/admin");
  redirect("/admin?section=access&success=Admin user removed");
}

