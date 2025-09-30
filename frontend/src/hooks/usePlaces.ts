import { useState, useEffect } from 'react';
import { placesAPI } from '../services/api';
import { PlacesResponse, LocationPhotosResponse } from '../types';

export const usePlaces = () => {
  const [places, setPlaces] = useState<PlacesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await placesAPI.getAll();
      setPlaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch places');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  return {
    places,
    loading,
    error,
    refetch: fetchPlaces,
  };
};

export const useLocationPhotos = (latitude?: number, longitude?: number) => {
  const [locationData, setLocationData] = useState<LocationPhotosResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocationPhotos = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await placesAPI.getLocationPhotos(lat, lng);
      setLocationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch location photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      fetchLocationPhotos(latitude, longitude);
    }
  }, [latitude, longitude]);

  return {
    locationData,
    loading,
    error,
    fetchLocationPhotos,
  };
};

