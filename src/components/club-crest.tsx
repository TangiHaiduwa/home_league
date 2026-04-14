type ClubCrestProps = {
  teamName: string;
  size?: "sm" | "md" | "lg";
};

function getInitials(teamName: string) {
  const words = teamName.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").filter(Boolean);
  if (words.length === 0) return "FC";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getHue(teamName: string) {
  let value = 0;
  for (let i = 0; i < teamName.length; i += 1) {
    value = (value + teamName.charCodeAt(i) * (i + 3)) % 360;
  }
  return value;
}

export function ClubCrest({ teamName, size = "md" }: ClubCrestProps) {
  const initials = getInitials(teamName);
  const hue = getHue(teamName);
  const sizeClass = size === "sm" ? "h-8 w-8 text-[10px]" : size === "lg" ? "h-14 w-14 text-base" : "h-10 w-10 text-xs";

  return (
    <div
      className={`${sizeClass} inline-flex items-center justify-center rounded-full border border-white/60 font-black tracking-[0.08em] text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 65) % 360} 74% 32%))` }}
      aria-label={`${teamName} crest`}
      title={teamName}
    >
      {initials}
    </div>
  );
}
