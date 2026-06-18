import { getWaitingList } from '@/lib/db/reservations';
import { predictWaitTimes } from '@/lib/ai/wait-predictor';
import { updateReservation } from '@/lib/db/reservations';

export async function POST() {
  const waitingList = getWaitingList();
  const predictions = await predictWaitTimes(waitingList);

  // Persist predictions back to each reservation
  for (const p of predictions) {
    updateReservation(p.id, { estimatedWaitMinutes: p.estimatedWaitMinutes });
  }

  return Response.json({ predictions });
}
