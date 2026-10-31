import Elevator from '../models/Elevator.js';
import Complaint from '../models/Complaint.js';
import Maintenance from '../models/Maintenance.js';

/**
 * Keeps elevator status in sync with active work.
 * "out_of_service" is only ever changed manually by an admin.
 */
export async function syncElevatorStatus(elevatorId) {
  const elevator = await Elevator.findById(elevatorId);
  if (!elevator || elevator.status === 'out_of_service') return;
  const [repair, service] = await Promise.all([
    Complaint.exists({ elevator: elevatorId, status: 'in_progress' }),
    Maintenance.exists({ elevator: elevatorId, status: 'in_progress' }),
  ]);
  const next = repair || service ? 'under_maintenance' : 'operational';
  if (elevator.status !== next) {
    elevator.status = next;
    await elevator.save();
  }
}
