import { useState, useEffect } from 'react';
import { Event } from '../types';
import { eventsAPI } from '../services/api';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsAPI.getAll();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (event: Partial<Event>) => {
    try {
      const newEvent = await eventsAPI.create(event);
      setEvents(prev => [newEvent, ...prev]);
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      throw err;
    }
  };

  const updateEvent = async (id: string, event: Partial<Event>) => {
    try {
      const updatedEvent = await eventsAPI.update(id, event);
      setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e));
      return updatedEvent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await eventsAPI.delete(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      throw err;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
};
