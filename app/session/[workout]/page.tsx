'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { WORKOUT_ORDER } from '@/lib/program';
import type { WorkoutType } from '@/lib/types';
import SessionScreen from '@/components/SessionScreen';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const workout = params?.workout as string;

  useEffect(() => {
    if (!WORKOUT_ORDER.includes(workout as WorkoutType)) {
      router.replace('/home');
    }
  }, [workout, router]);

  if (!WORKOUT_ORDER.includes(workout as WorkoutType)) return null;

  return <SessionScreen workoutType={workout as WorkoutType} />;
}
