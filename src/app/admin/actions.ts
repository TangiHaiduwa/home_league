"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server-auth";

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

function revalidateLeagueViews() {
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/table");
  revalidatePath("/teams");
  revalidatePath("/scorers");
  revalidatePath("/admin");
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

export async function updateMatchResult(formData: FormData) {
  const { supabase } = await requireAdmin();

  const matchId = Number(formData.get("match_id"));
  const status = String(formData.get("status") ?? "scheduled");
  const homeScoreRaw = String(formData.get("home_score") ?? "");
  const awayScoreRaw = String(formData.get("away_score") ?? "");
  const liveMinuteRaw = String(formData.get("live_minute") ?? "");

  const homeScore = homeScoreRaw === "" ? null : Number(homeScoreRaw);
  const awayScore = awayScoreRaw === "" ? null : Number(awayScoreRaw);
  const liveMinute = liveMinuteRaw === "" ? null : Number(liveMinuteRaw);

  if (!Number.isFinite(matchId)) {
    redirect("/admin?error=Invalid match selected");
  }

  const { error } = await supabase
    .from("matches")
    .update({
      status,
      home_score: homeScore,
      away_score: awayScore,
      live_minute: liveMinute,
    })
    .eq("id", matchId);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidateLeagueViews();
  redirect("/admin?success=Match updated");
}

export async function createNewsPost(formData: FormData) {
  const { supabase } = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const snippet = String(formData.get("snippet") ?? "").trim();

  if (!title || !snippet) {
    redirect("/admin?error=Title and snippet are required");
  }

  const { error } = await supabase.from("news").insert({ title, snippet });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/admin");
  redirect("/admin?success=News published");
}

export async function createTeam(formData: FormData) {
  const { supabase } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const shortNameRaw = String(formData.get("short_name") ?? "").trim();

  if (!name) {
    redirect("/admin?error=Team name is required");
  }

  const short_name = shortNameRaw === "" ? null : shortNameRaw.toUpperCase();

  const { error } = await supabase
    .from("teams")
    .upsert({ name, short_name }, { onConflict: "name" });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidateLeagueViews();
  redirect("/admin?success=Team saved");
}

export async function createPlayer(formData: FormData) {
  const { supabase } = await requireAdmin();

  const teamId = Number(formData.get("team_id"));
  const fullName = String(formData.get("full_name") ?? "").trim();
  const shirtRaw = String(formData.get("shirt_number") ?? "").trim();
  const positionRaw = String(formData.get("position") ?? "").trim();
  const goalsRaw = String(formData.get("goals") ?? "").trim();
  const assistsRaw = String(formData.get("assists") ?? "").trim();

  if (!Number.isFinite(teamId)) {
    redirect("/admin?error=Select a valid team");
  }
  if (!fullName) {
    redirect("/admin?error=Player name is required");
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
        full_name: fullName,
        shirt_number,
        position,
      },
      { onConflict: "team_id,full_name" },
    )
    .select("id")
    .single();

  if (playerError || !player) {
    redirect(`/admin?error=${encodeURIComponent(playerError?.message ?? "Could not save player")}`);
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
    redirect(`/admin?error=${encodeURIComponent(statsError.message)}`);
  }

  revalidateLeagueViews();
  redirect("/admin?success=Player saved");
}

export async function createFixture(formData: FormData) {
  const { supabase } = await requireAdmin();

  const homeTeamId = Number(formData.get("home_team_id"));
  const awayTeamId = Number(formData.get("away_team_id"));
  const matchDate = String(formData.get("match_date") ?? "").trim();
  const venueRaw = String(formData.get("venue") ?? "").trim();
  const status = String(formData.get("status") ?? "scheduled");
  const homeScoreRaw = String(formData.get("home_score") ?? "").trim();
  const awayScoreRaw = String(formData.get("away_score") ?? "").trim();
  const liveMinuteRaw = String(formData.get("live_minute") ?? "").trim();

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

  const { error } = await supabase.from("matches").insert({
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    match_date: matchDate,
    venue,
    status,
    home_score,
    away_score,
    live_minute,
  });

  if (error) {
    redirect(`/admin?section=matches&error=${encodeURIComponent(error.message)}`);
  }

  revalidateLeagueViews();
  redirect("/admin?section=matches&success=Fixture created");
}

async function getMatchOrRedirect(matchIdRaw: FormDataEntryValue | null) {
  const matchId = Number(matchIdRaw);
  if (!Number.isFinite(matchId)) {
    redirect("/admin?error=Invalid match selected");
  }

  const { supabase } = await requireAdmin();
  const { data: match, error } = await supabase
    .from("matches")
    .select("id, status, home_score, away_score, live_minute")
    .eq("id", matchId)
    .single();

  if (error || !match) {
    redirect("/admin?error=Match not found");
  }

  return { supabase, match };
}

export async function startLiveMatch(formData: FormData) {
  const { supabase, match } = await getMatchOrRedirect(formData.get("match_id"));

  const { error } = await supabase
    .from("matches")
    .update({
      status: "live",
      home_score: match.home_score ?? 0,
      away_score: match.away_score ?? 0,
      live_minute: match.live_minute ?? 1,
    })
    .eq("id", match.id);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidateLeagueViews();
  redirect("/admin?success=Match started live");
}

export async function addHomeGoal(formData: FormData) {
  const { supabase, match } = await getMatchOrRedirect(formData.get("match_id"));
  const { error } = await supabase
    .from("matches")
    .update({
      status: "live",
      home_score: (match.home_score ?? 0) + 1,
      away_score: match.away_score ?? 0,
      live_minute: match.live_minute ?? 1,
    })
    .eq("id", match.id);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidateLeagueViews();
  redirect("/admin?success=Home goal added");
}

export async function addAwayGoal(formData: FormData) {
  const { supabase, match } = await getMatchOrRedirect(formData.get("match_id"));
  const { error } = await supabase
    .from("matches")
    .update({
      status: "live",
      home_score: match.home_score ?? 0,
      away_score: (match.away_score ?? 0) + 1,
      live_minute: match.live_minute ?? 1,
    })
    .eq("id", match.id);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidateLeagueViews();
  redirect("/admin?success=Away goal added");
}

export async function addMinute(formData: FormData) {
  const { supabase, match } = await getMatchOrRedirect(formData.get("match_id"));
  const { error } = await supabase
    .from("matches")
    .update({
      status: "live",
      live_minute: Math.min((match.live_minute ?? 0) + 1, 130),
    })
    .eq("id", match.id);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidateLeagueViews();
  redirect("/admin?success=Minute updated");
}

export async function finishMatch(formData: FormData) {
  const { supabase, match } = await getMatchOrRedirect(formData.get("match_id"));
  const { error } = await supabase
    .from("matches")
    .update({
      status: "finished",
      home_score: match.home_score ?? 0,
      away_score: match.away_score ?? 0,
      live_minute: null,
    })
    .eq("id", match.id);

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidateLeagueViews();
  redirect("/admin?success=Match marked full-time");
}
