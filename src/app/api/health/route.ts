export const dynamic = "force-dynamic";

export async function GET() {
  // App is designed to run WITHOUT a database — health is always OK.
  return Response.json({
    ok: true,
    app: "CueVerse Billiards",
    database: process.env.DATABASE_URL ? "configured" : "not-configured",
  });
}
