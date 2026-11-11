// src/components/map/utils/routeProvider.ts
import { api } from '../../../api/client';
import type { LatLng, RoutePolylineResult } from '../types';

type RouteApiResponse = {
  coordinates: LatLng[];
  distance_meters: number | null;
  duration_seconds: number | null;
};

export async function fetchRoutePolyline(
  origin: LatLng,
  destination: LatLng,
): Promise<RoutePolylineResult> {
  const { data } = await api.get<RouteApiResponse>('/routing/route', {
    params: {
      origin_lat: origin.latitude,
      origin_lng: origin.longitude,
      dest_lat: destination.latitude,
      dest_lng: destination.longitude,
    },
  });

  return {
    coordinates: data.coordinates,
    distanceMeters: data.distance_meters ?? undefined,
    durationSeconds: data.duration_seconds ?? undefined,
  };
}