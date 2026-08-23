export type RoutePointKind = "origin" | "stop" | "destination";

export interface RoutePoint {
  name: string;
  lat: number;
  lng: number;
  kind: RoutePointKind;
}

export interface RouteLeg {
  from: string;
  to: string;
  distance_m: number;
  duration_s: number;
}

export interface RouteLineString {
  type: "LineString";
  coordinates: [number, number][];
}

export interface RideRoute {
  waypoints_key: string;
  from_city: string;
  to_city: string;
  via_cities: string[];
  points: RoutePoint[];
  geometry: RouteLineString | null;
  distance_m: number | null;
  duration_s: number | null;
  legs: RouteLeg[];
  provider: "osrm" | null;
}
