import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const BOT_USER_AGENTS = [
  "whatsapp",
  "telegram",
  "facebookexternalhit",
  "twitterbot",
  "slackbot",
  "discordbot",
  "googlebot",
  "bingbot",
];

/**
 * High-performance dynamic OpenGraph meta-tag router for social sharing.
 * Detects crawlers to return optimized metadata, and redirects real users directly to the ride detail page.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ rideId: string }> }
) {
  const { rideId } = await context.params;
  if (!rideId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const userAgent = req.headers.get("user-agent")?.toLowerCase() || "";
  const isBot = BOT_USER_AGENTS.some((bot) => userAgent.includes(bot));

  const supabase = createServiceRoleClient(); // safe bypass for dynamic crawler indexing

  // Fetch ride details
  const { data: ride, error } = await supabase
    .from("rides")
    .select(`
      from_city,
      to_city,
      date,
      time,
      price,
      meeting_point,
      profiles!inner(name)
    `)
    .eq("id", rideId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !ride) {
    console.warn(`[share-api] Ride ${rideId} not found or active. Redirecting to home.`);
    return NextResponse.redirect(new URL("/", req.url));
  }

  const { from_city, to_city, date, time, price, meeting_point, profiles } = ride as any;
  const driverName = profiles?.name || "Un utente Andamus";
  
  // Format readable dates
  const formattedDate = new Date(date).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const formattedTime = time.slice(0, 5);

  const title = `Passaggio da ${from_city} a ${to_city} 🚗`;
  const description = `Partenza ${formattedDate} ore ${formattedTime}. Quota di viaggio: €${price}. Autista: ${driverName}. ${
    meeting_point ? `Ritrovo: ${meeting_point}.` : ""
  } Prenota ora su Andamus!`;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://andamus.vercel.app";
  const redirectUrl = `${siteUrl}/it/corsa/${rideId}?ref=invite`;
  
  // Dynamic OpenGraph Visual Card Image (premium Sardinian visual asset)
  const imageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop";

  // If a bot is crawling, return a dedicated SEO-optimized HTML payload containing only head tags
  if (isBot) {
    const botHtml = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta name="description" content="${description}">
        
        <!-- OpenGraph crawl properties -->
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${imageUrl}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${redirectUrl}">
        <meta property="og:site_name" content="Andamus">
        
        <!-- Twitter crawler -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${imageUrl}">
      </head>
      <body>
        <p>Reindirizzamento a Andamus...</p>
      </body>
      </html>
    `;
    return new Response(botHtml, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // If a real user opens it, return the rich OG tags for safe browser caching but instantly trigger redirect script
  const userHtml = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta name="description" content="${description}">
      
      <!-- OpenGraph crawl properties -->
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${imageUrl}">
      <meta property="og:type" content="website">
      <meta property="og:url" content="${redirectUrl}">
      <meta property="og:site_name" content="Andamus">
      
      <!-- Instant Client Redirect -->
      <script>
        window.location.replace("${redirectUrl}");
      </script>
    </head>
    <body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;">
        <div style="border:3px solid #ffb3b1;border-top-color:transparent;border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:0 auto 15px;"></div>
        <p style="font-size:14px;letter-spacing:1px;opacity:0.8;">Apertura viaggio su Andamus...</p>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </body>
    </html>
  `;

  return new Response(userHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
