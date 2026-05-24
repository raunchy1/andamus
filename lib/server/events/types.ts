/**
 * Domain Event Types
 * ==================
 * Strongly-typed domain events for the event-driven architecture.
 * WHY: Decouples business logic from side effects (notifications, analytics,
 * caching). Enables async workflows that scale independently.
 */

// ---------------------------------------------------------------------------
// Event metadata (attached to every event)
// ---------------------------------------------------------------------------

export interface EventMetadata {
  eventId: string;
  correlationId: string;
  causationId?: string;
  emittedAt: string;
  emittedBy: string; // userId or "system"
  version: number;
  source: string; // service/component name
}

// ---------------------------------------------------------------------------
// Domain events
// ---------------------------------------------------------------------------

export interface RideCreatedEvent {
  type: "ride.created";
  payload: {
    rideId: string;
    driverId: string;
    fromCity: string;
    toCity: string;
    date: string;
    time: string;
    price: number;
    seats: number;
    preferences: {
      smokingAllowed?: boolean;
      petsAllowed?: boolean;
      largeLuggage?: boolean;
      womenOnly?: boolean;
      studentsOnly?: boolean;
    };
  };
}

export interface RideUpdatedEvent {
  type: "ride.updated";
  payload: {
    rideId: string;
    driverId: string;
    changes: Record<string, unknown>;
    previousValues: Record<string, unknown>;
  };
}

export interface RideCancelledEvent {
  type: "ride.cancelled";
  payload: {
    rideId: string;
    driverId: string;
    reason?: string;
    affectedPassengerIds: string[];
  };
}

export interface RideCompletedEvent {
  type: "ride.completed";
  payload: {
    rideId: string;
    driverId: string;
    passengerIds: string[];
  };
}

export interface BookingCreatedEvent {
  type: "booking.created";
  payload: {
    bookingId: string;
    rideId: string;
    passengerId: string;
    driverId: string;
    status: string;
  };
}

export interface BookingConfirmedEvent {
  type: "booking.confirmed";
  payload: {
    bookingId: string;
    rideId: string;
    passengerId: string;
    driverId: string;
    confirmedAt: string;
  };
}

export interface BookingRejectedEvent {
  type: "booking.rejected";
  payload: {
    bookingId: string;
    rideId: string;
    passengerId: string;
    driverId: string;
    reason?: string;
  };
}

export interface BookingCancelledEvent {
  type: "booking.cancelled";
  payload: {
    bookingId: string;
    rideId: string;
    passengerId: string;
    driverId: string;
    cancelledBy: "driver" | "passenger";
    reason?: string;
  };
}

export interface PaymentCompletedEvent {
  type: "payment.completed";
  payload: {
    paymentIntentId: string;
    bookingId: string;
    rideId: string;
    amount: number;
    currency: string;
    payerId: string;
    payeeId: string;
  };
}

export interface PaymentFailedEvent {
  type: "payment.failed";
  payload: {
    paymentIntentId: string;
    bookingId: string;
    rideId: string;
    amount: number;
    failureMessage: string;
    payerId: string;
  };
}

export interface UserRegisteredEvent {
  type: "user.registered";
  payload: {
    userId: string;
    email: string;
    name: string;
    referralCode?: string;
  };
}

export interface UserUpdatedEvent {
  type: "user.updated";
  payload: {
    userId: string;
    changes: Record<string, unknown>;
  };
}

export interface UserFollowedEvent {
  type: "user.followed";
  payload: {
    followerId: string;
    followeeId: string;
  };
}

export interface UserBlockedEvent {
  type: "user.blocked";
  payload: {
    blockerId: string;
    blockedId: string;
    reason?: string;
  };
}

export interface MessageSentEvent {
  type: "message.sent";
  payload: {
    messageId: string;
    bookingId: string;
    senderId: string;
    receiverId: string;
    content: string;
    contentType: "text" | "image" | "location" | "audio";
  };
}

export interface ReviewCreatedEvent {
  type: "review.created";
  payload: {
    reviewId: string;
    rideId: string;
    reviewerId: string;
    reviewedId: string;
    rating: number;
    comment?: string;
  };
}

export interface NotificationDeliveredEvent {
  type: "notification.delivered";
  payload: {
    notificationId: string;
    userId: string;
    channel: "push" | "email" | "in_app" | "sms";
    deliveredAt: string;
  };
}

export interface NotificationFailedEvent {
  type: "notification.failed";
  payload: {
    notificationId: string;
    userId: string;
    channel: "push" | "email" | "in_app" | "sms";
    errorMessage: string;
    retryCount: number;
  };
}

export interface GroupJoinedEvent {
  type: "group.joined";
  payload: {
    groupId: string;
    userId: string;
    joinedAt: string;
  };
}

export interface EventJoinedEvent {
  type: "event.joined";
  payload: {
    eventId: string;
    userId: string;
    joinedAt: string;
  };
}

export interface ContentReportedEvent {
  type: "content.reported";
  payload: {
    reportId: string;
    reporterId: string;
    reportedUserId: string;
    contentType: string;
    reason: string;
    severity: "low" | "medium" | "high" | "critical";
  };
}

export interface ModerationActionEvent {
  type: "moderation.action";
  payload: {
    actionId: string;
    moderatorId: string;
    targetUserId: string;
    actionType: string;
    reason: string;
  };
}

export interface SubscriptionChangedEvent {
  type: "subscription.changed";
  payload: {
    userId: string;
    planId: string;
    status: string;
    previousPlanId?: string;
  };
}

export interface SafetyAlertEvent {
  type: "safety.alert";
  payload: {
    alertId: string;
    userId: string;
    rideId?: string;
    alertType: string;
    location?: { lat: number; lng: number };
  };
}

export interface AnalyticsEvent {
  type: "analytics.event";
  payload: {
    eventName: string;
    userId?: string;
    properties: Record<string, unknown>;
    timestamp: string;
  };
}

// ---------------------------------------------------------------------------
// Union type of all domain events
// ---------------------------------------------------------------------------

export type DomainEvent =
  | RideCreatedEvent
  | RideUpdatedEvent
  | RideCancelledEvent
  | RideCompletedEvent
  | BookingCreatedEvent
  | BookingConfirmedEvent
  | BookingRejectedEvent
  | BookingCancelledEvent
  | PaymentCompletedEvent
  | PaymentFailedEvent
  | UserRegisteredEvent
  | UserUpdatedEvent
  | UserFollowedEvent
  | UserBlockedEvent
  | MessageSentEvent
  | ReviewCreatedEvent
  | NotificationDeliveredEvent
  | NotificationFailedEvent
  | GroupJoinedEvent
  | EventJoinedEvent
  | ContentReportedEvent
  | ModerationActionEvent
  | SubscriptionChangedEvent
  | SafetyAlertEvent
  | AnalyticsEvent;

export type DomainEventType = DomainEvent["type"];

// ---------------------------------------------------------------------------
// Enveloped event (what gets published)
// ---------------------------------------------------------------------------

export interface EventEnvelope<E extends DomainEvent = DomainEvent> {
  event: E;
  metadata: EventMetadata;
}

// ---------------------------------------------------------------------------
// Event handler type
// ---------------------------------------------------------------------------

export type EventHandler<E extends DomainEvent = DomainEvent> = (
  envelope: EventEnvelope<E>
) => Promise<{ success: boolean; error?: string }>;

export interface HandlerRegistration<E extends DomainEvent = DomainEvent> {
  eventType: E["type"];
  handler: EventHandler<E>;
  idempotent?: boolean;
  retryable?: boolean;
  maxRetries?: number;
}
