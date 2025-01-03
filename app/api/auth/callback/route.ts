import { NextResponse } from "next/server";

// Update the scopes to include playback control
const scopes = [
  "playlist-read-private",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-modify-private",
  "user-read-currently-playing",
  "user-library-read",
  "user-read-email",
  "user-read-private"
].join(" ");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString("base64"),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!,
        }),
      }
    );

    const data = await tokenResponse.json();

    // Redirect to dashboard with access token as a hash parameter
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI?.replace(
        "/api/auth/callback",
        "/dashboard"
      )}#access_token=${data.access_token}`
    );
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
