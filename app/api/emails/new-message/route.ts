import { NextRequest, NextResponse } from "next/server";
import { sendNewMessageEmail, wasRecentlyOnline } from "@/lib/emails/send";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "recipientId",
      "recipientEmail",
      "recipientName",
      "senderName",
      "messagePreview",
      "bookingId",
      "rideId",
      "fromCity",
      "toCity",
    ];

    for (const field of requiredFields) {
      if (!body[field] && body[field] !== false) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if recipient was recently online (within last 5 minutes)
    // If so, don't send email to avoid spam
    const recentlyOnline = await wasRecentlyOnline(body.recipientId);
    if (recentlyOnline) {
      return NextResponse.json({ 
        success: true, 
        skipped: true, 
        reason: "User was recently online" 
      });
    }

    const result = await sendNewMessageEmail({
      recipientId: body.recipientId,
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      senderName: body.senderName,
      messagePreview: body.messagePreview,
      bookingId: body.bookingId,
      rideId: body.rideId,
      fromCity: body.fromCity,
      toCity: body.toCity,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in new-message API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
