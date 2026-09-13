import React, { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import type { BreadcrumbPoint } from '../types';

interface GoogleMapsGeofenceOverlaysProps {
  homeLat: number;
  homeLng: number;
  currentLat: number;
  currentLng: number;
  safeRadiusMeters: number;
  alertRadiusMeters: number;
  accuracyMeters?: number;
  breadcrumbs?: BreadcrumbPoint[];
}

export const GoogleMapsGeofenceOverlays: React.FC<GoogleMapsGeofenceOverlaysProps> = ({
  homeLat,
  homeLng,
  currentLat,
  currentLng,
  safeRadiusMeters,
  alertRadiusMeters,
  accuracyMeters = 5,
  breadcrumbs = [],
}) => {
  const map = useMap();
  const safeCircleRef = useRef<google.maps.Circle | null>(null);
  const alertCircleRef = useRef<google.maps.Circle | null>(null);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const bearingLineRef = useRef<google.maps.Polyline | null>(null);
  const breadcrumbsLineRef = useRef<google.maps.Polyline | null>(null);

  // Update Safe Zone and Alert Perimeter Circles
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    // Clean up prior instances
    if (safeCircleRef.current) safeCircleRef.current.setMap(null);
    if (alertCircleRef.current) alertCircleRef.current.setMap(null);

    // Green Safe Zone Circle
    safeCircleRef.current = new google.maps.Circle({
      map,
      center: { lat: homeLat, lng: homeLng },
      radius: safeRadiusMeters,
      strokeColor: '#10B981',
      strokeOpacity: 0.95,
      strokeWeight: 2.5,
      fillColor: '#10B981',
      fillOpacity: 0.16,
      clickable: false,
      zIndex: 1,
    });

    // Red/Rose Alert Perimeter Circle
    alertCircleRef.current = new google.maps.Circle({
      map,
      center: { lat: homeLat, lng: homeLng },
      radius: alertRadiusMeters,
      strokeColor: '#F43F5E',
      strokeOpacity: 0.95,
      strokeWeight: 2.5,
      fillColor: '#F43F5E',
      fillOpacity: 0.09,
      clickable: false,
      zIndex: 1,
    });

    return () => {
      if (safeCircleRef.current) safeCircleRef.current.setMap(null);
      if (alertCircleRef.current) alertCircleRef.current.setMap(null);
    };
  }, [map, homeLat, homeLng, safeRadiusMeters, alertRadiusMeters]);

  // Update Accuracy Circle and Bearing Vector Line
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    if (accuracyCircleRef.current) accuracyCircleRef.current.setMap(null);
    if (bearingLineRef.current) bearingLineRef.current.setMap(null);

    // Cyan Accuracy Circle around current device
    accuracyCircleRef.current = new google.maps.Circle({
      map,
      center: { lat: currentLat, lng: currentLng },
      radius: Math.max(accuracyMeters, 4),
      strokeColor: '#38BDF8',
      strokeOpacity: 0.6,
      strokeWeight: 1.5,
      fillColor: '#38BDF8',
      fillOpacity: 0.12,
      clickable: false,
      zIndex: 2,
    });

    // Bearing Line from Home Base to Elder
    bearingLineRef.current = new google.maps.Polyline({
      map,
      path: [
        { lat: homeLat, lng: homeLng },
        { lat: currentLat, lng: currentLng },
      ],
      strokeColor: '#F59E0B',
      strokeOpacity: 0.85,
      strokeWeight: 2.5,
      clickable: false,
      zIndex: 3,
    });

    return () => {
      if (accuracyCircleRef.current) accuracyCircleRef.current.setMap(null);
      if (bearingLineRef.current) bearingLineRef.current.setMap(null);
    };
  }, [map, homeLat, homeLng, currentLat, currentLng, accuracyMeters]);

  // Update Breadcrumb Trajectory
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    if (breadcrumbsLineRef.current) breadcrumbsLineRef.current.setMap(null);

    if (breadcrumbs && breadcrumbs.length > 1) {
      breadcrumbsLineRef.current = new google.maps.Polyline({
        map,
        path: breadcrumbs.map((b) => ({ lat: b.latitude, lng: b.longitude })),
        strokeColor: '#06B6D4',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        clickable: false,
        zIndex: 2,
      });
    }

    return () => {
      if (breadcrumbsLineRef.current) breadcrumbsLineRef.current.setMap(null);
    };
  }, [map, breadcrumbs]);

  return null;
};
