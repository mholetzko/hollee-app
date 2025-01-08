import { NextResponse } from "next/server";

function FQDN() {
  return process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI
    ? `https://${process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI}`
    : "http://localhost:3000";
}

function redirectUri() {
  return `${FQDN()}/api/auth/callback`;
}

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
          redirect_uri: redirectUri(),
        }),
      }
    );

    const data = await tokenResponse.json();

    // Redirect to dashboard with access token as a hash parameter
    return Response.redirect(
      `${redirectUri()?.replace(
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
