/**
 * Seed script - WARNING: removes all existing users, elevators, complaints,
 * maintenance records and counters, then inserts realistic demo data.
 * Usage: npm run seed
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import User from '../models/User.js';
import Elevator from '../models/Elevator.js';
import Complaint from '../models/Complaint.js';
import Maintenance from '../models/Maintenance.js';
import Counter from '../models/Counter.js';

const NOW = Date.now();
const DAY = 86400000;
const HOUR = 3600000;
const daysAgo = (n, extraHours = 0) => new Date(NOW - n * DAY - extraHours * HOUR);
const daysAhead = (n) => new Date(NOW + n * DAY);

let seedState = 42;
const rand = () => {
  seedState |= 0;
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (min, max) => Math.round(min + rand() * (max - min));

const DESCRIPTIONS = {
  door_system: [
    'Doors keep re-opening on the 9th floor and then close very slowly. The lift waits about 30 seconds before moving.',
    'Car door stuck partially open between floors 4 and 5. Had to press the close button repeatedly before it moved.',
    'Loud grinding noise when the doors open on the ground floor and they sometimes bounce back before closing.',
  ],
  motor_drive: [
    'Lift jerks when starting from the ground floor and there is a humming sound coming from the machine room.',
    'Elevator slows down between floors and takes noticeably longer to arrive. Smell of hot oil near the top floor.',
    'Car stops intermittently and restarts after a few seconds, especially when carrying more than five people.',
  ],
  cables_ropes: [
    'Slight swaying and a squeaking sound from above the car while travelling between floors 3 and 6.',
    'Visible oil stains and a rubbing noise reported near the car top by the clinic maintenance staff.',
  ],
  control_panel: [
    'Floor selection panel shows the wrong floor number and the elevator sometimes skips the requested floor.',
    'Car operating panel resets randomly and registered calls get cancelled after a few seconds.',
  ],
  buttons_indicators: [
    'Call button on floor 7 does not light up when pressed and the lift is slow to respond.',
    'Floor indicator display inside the car is blank and the arrow lights are flickering.',
    'Several buttons in the car need to be pressed hard multiple times before they register.',
  ],
  lighting: [
    'Interior light is flickering and goes dark for a few seconds during the ride.',
    'Cabin lights are out and only the emergency light is on.',
  ],
  safety_brake: ['Elevator stopped abruptly and the safety stop engaged between floors 10 and 11. Passengers were released after a reset.'],
  leveling: [
    'Car stops about 5 cm below the floor level at floor 5, which is a tripping hazard.',
    'Floor leveling is uneven on the upper floors; the car overshoots slightly before correcting.',
    'Car does not align with the landing at the ground floor when carrying heavy loads.',
  ],
  ventilation: ['Cabin fan is not working and the lift becomes very warm and stuffy during peak hours.'],
  noise_vibration: [
    'Rattling vibration felt throughout the ride and a metallic knocking noise near floor 8.',
    'Constant humming vibration from the lift shaft is heard in adjacent apartments at night.',
  ],
  other: ['Mirror panel inside the car is loose and rattles when the doors close.'],
};

const REPAIR_NOTES = {
  door_system: ['Realigned door hanger rollers, cleaned the sill track and adjusted the door-close force.', 'Replaced worn door rollers and re-tuned the door operator speed profile.'],
  motor_drive: ['Tightened drive terminal connections and re-tuned the start ramp. Machine room ventilation cleaned.', 'Replaced drive cooling fan and re-calibrated motor current limits.'],
  cables_ropes: ['Cleaned and lubricated hoist ropes; tension equalised across all ropes.', 'Replaced two worn rope sections and re-tensioned the set.'],
  control_panel: ['Reseated controller connectors and updated the floor-selection parameters.', 'Replaced the faulty car operating panel board and tested all calls.'],
  buttons_indicators: ['Cleaned button contacts and replaced the failed indicator LEDs.', 'Replaced the worn call button module and tested wiring continuity.'],
  lighting: ['Replaced failed LED driver and checked the cabin lighting circuit.', 'Replaced cabin LED panel and tested the emergency light battery.'],
  safety_brake: ['Inspected governor and safety gear, reset the safety circuit and verified brake stopping distance.'],
  leveling: ['Cleaned and re-aligned the leveling sensors and re-learned floor positions.', 'Adjusted leveling vanes and re-calibrated landing positions.'],
  ventilation: ['Replaced the cabin fan motor and cleaned the vent grille.'],
  noise_vibration: ['Replaced worn guide shoe liners and lubricated the guide rails.', 'Tightened rail brackets and replaced vibration dampers on the machine bed.'],
  other: ['Re-fixed the mirror panel with new brackets.'],
};

const TECH_FOR = {
  door_system: 0, control_panel: 0, motor_drive: 1, noise_vibration: 1, leveling: 1,
  cables_ropes: 2, safety_brake: 2, ventilation: 3, lighting: 3, buttons_indicators: 3, other: 3,
};

// [elevatorIndex, category, daysAgo, severity, state(c completed, p pending, a assigned, i in progress, r rejected)]
const SCENARIOS = [
  [2, 'door_system', 172, 'medium', 'c'], [2, 'door_system', 140, 'medium', 'c'], [2, 'door_system', 112, 'high', 'c'],
  [2, 'door_system', 84, 'medium', 'c'], [2, 'door_system', 52, 'high', 'c'], [2, 'door_system', 21, 'high', 'c'], [2, 'door_system', 2, 'high', 'a'],
  [6, 'motor_drive', 120, 'high', 'c'], [6, 'motor_drive', 70, 'high', 'c'], [6, 'motor_drive', 4, 'critical', 'i'],
  [7, 'cables_ropes', 150, 'medium', 'c'], [7, 'cables_ropes', 95, 'high', 'c'], [7, 'cables_ropes', 45, 'high', 'c'], [7, 'cables_ropes', 9, 'medium', 'c'], [7, 'cables_ropes', 1, 'medium', 'p'],
  [0, 'buttons_indicators', 160, 'low', 'c'], [0, 'buttons_indicators', 100, 'low', 'c'], [0, 'buttons_indicators', 58, 'medium', 'c'], [0, 'buttons_indicators', 12, 'low', 'c'], [0, 'lighting', 30, 'low', 'c'],
  [1, 'leveling', 130, 'medium', 'c'], [1, 'leveling', 78, 'medium', 'c'], [1, 'leveling', 26, 'medium', 'c'], [1, 'other', 35, 'low', 'r'],
  [3, 'lighting', 118, 'low', 'c'], [3, 'safety_brake', 75, 'critical', 'c'], [3, 'lighting', 40, 'low', 'c'], [3, 'control_panel', 14, 'medium', 'c'],
  [4, 'control_panel', 145, 'high', 'c'], [4, 'control_panel', 88, 'medium', 'c'], [4, 'control_panel', 36, 'high', 'c'], [4, 'control_panel', 2, 'high', 'i'],
  [5, 'noise_vibration', 105, 'medium', 'c'], [5, 'noise_vibration', 50, 'medium', 'c'], [5, 'ventilation', 62, 'low', 'c'], [5, 'door_system', 18, 'low', 'c'], [5, 'buttons_indicators', 1, 'low', 'p'],
];

const PREVENTIVE_COMPONENTS = [
  { component: 'door_system', action: 'lubricated' },
  { component: 'cables_ropes', action: 'inspected' },
  { component: 'motor_drive', action: 'inspected' },
  { component: 'safety_brake', action: 'inspected' },
  { component: 'control_panel', action: 'inspected' },
];

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log(`[seed] Connected to ${mongoose.connection.name}. Clearing existing data...`);
  await Promise.all([User.deleteMany({}), Elevator.deleteMany({}), Complaint.deleteMany({}), Maintenance.deleteMany({}), Counter.deleteMany({})]);

  // ---- Users ----
  const admin = await User.create({ name: 'Arjun Mehta', email: 'admin@elevai.com', password: 'Admin@123', role: 'admin', phone: '+91 98400 10001' });
  const techData = [
    ['Rajesh Kumar', 'technician@elevai.com', 'Door systems and control panels', '+91 98400 20001'],
    ['Suresh Babu', 'suresh.babu@elevai.com', 'Traction machines and drives', '+91 98400 20002'],
    ['Meena Iyer', 'meena.iyer@elevai.com', 'Ropes, safety gear and brakes', '+91 98400 20003'],
    ['Karthik Rao', 'karthik.rao@elevai.com', 'Electrical, lighting and indicators', '+91 98400 20004'],
  ];
  const techs = [];
  for (const [name, email, specialization, phone] of techData) {
    techs.push(await User.create({ name, email, password: 'Tech@123', role: 'technician', specialization, phone }));
  }
  const userData = [
    ['Priya Sharma', 'user@elevai.com', 'Marina Heights Tower'],
    ['Vikram Patel', 'vikram.patel@elevai.com', 'Marina Heights Tower'],
    ['Ananya Nair', 'ananya.nair@elevai.com', 'Anna Nagar Business Park'],
    ['Mohammed Faisal', 'mohammed.faisal@elevai.com', 'Velachery Residency'],
    ['Dr. Lakshmi Narayanan', 'lakshmi.n@elevai.com', 'Adyar Medical Centre'],
  ];
  const users = [];
  for (const [name, email, building] of userData) {
    users.push(await User.create({ name, email, password: 'User@123', role: 'user', building, phone: '+91 98400 3' + String(between(1000, 9999)) }));
  }

  // ---- Elevators ----
  const elevatorData = [
    ['ELV-1001', 'Marina Heights Tower', 'Tower A - Lobby Lift 1', 22, 'Otis Gen2 Comfort', 'operational', 2018],
    ['ELV-1002', 'Marina Heights Tower', 'Tower A - Lobby Lift 2', 22, 'Otis Gen2 Comfort', 'operational', 2018],
    ['ELV-1003', 'Marina Heights Tower', 'Tower A - Service Lift', 22, 'KONE MonoSpace 500', 'operational', 2016],
    ['ELV-1004', 'Anna Nagar Business Park', 'Block B - Main Lift', 12, 'Schindler 3300', 'operational', 2020],
    ['ELV-1005', 'Anna Nagar Business Park', 'Block B - Goods Lift', 12, 'Schindler 3300', 'under_maintenance', 2020],
    ['ELV-1006', 'Velachery Residency', 'Wing C - Lift 1', 16, 'Johnson Lifts E-Series', 'operational', 2015],
    ['ELV-1007', 'Velachery Residency', 'Wing C - Lift 2', 16, 'Johnson Lifts E-Series', 'out_of_service', 2015],
    ['ELV-1008', 'Adyar Medical Centre', 'Main Block - Patient Lift', 8, 'Thyssenkrupp Evolution 200', 'operational', 2012],
  ];
  const elevators = [];
  for (const [elevatorId, building, location, floors, model, status, year] of elevatorData) {
    elevators.push(await Elevator.create({ elevatorId, building, location, floors, model, status, installedOn: new Date(`${year}-06-15`), createdBy: admin._id }));
  }

  // ---- Complaints (and their corrective maintenance records) ----
  let completed = 0;
  for (let i = 0; i < SCENARIOS.length; i += 1) {
    const [ei, category, ago, severity, state] = SCENARIOS[i];
    const elevator = elevators[ei];
    const reporters = users.filter((u) => u.building === elevator.building);
    const reporter = reporters[i % reporters.length];
    const tech = techs[TECH_FOR[category]];
    const created = daysAgo(ago, (i * 5) % 10);
    const options = DESCRIPTIONS[category];
    const history = [{ status: 'pending', note: 'Complaint submitted', by: reporter._id, at: created }];
    const doc = {
      elevator: elevator._id, reportedBy: reporter._id, category, severity, status: 'pending',
      description: options[i % options.length], createdAt: created, statusHistory: history,
    };

    if (state !== 'p' && state !== 'r') {
      doc.assignedTo = tech._id;
      doc.assignedAt = new Date(created.getTime() + 3 * HOUR);
      doc.status = 'assigned';
      history.push({ status: 'assigned', note: `Assigned to ${tech.name}`, by: admin._id, at: doc.assignedAt });
    }
    if (state === 'i' || state === 'c') {
      doc.status = 'in_progress';
      history.push({ status: 'in_progress', note: 'Technician on site', by: tech._id, at: new Date(created.getTime() + 6 * HOUR) });
    }
    if (state === 'r') {
      doc.status = 'rejected';
      history.push({ status: 'rejected', note: 'Cosmetic issue. Will be fixed during the next preventive visit.', by: admin._id, at: new Date(created.getTime() + 5 * HOUR) });
    }
    let resolvedAt;
    if (state === 'c') {
      const replaced = completed % 3 === 0;
      const notesList = REPAIR_NOTES[category];
      resolvedAt = new Date(doc.assignedAt.getTime() + between(6, 52) * HOUR);
      doc.status = 'completed';
      doc.resolvedAt = resolvedAt;
      doc.component = category;
      doc.repairNotes = notesList[replaced ? notesList.length - 1 : 0];
      history.push({ status: 'completed', note: doc.repairNotes, by: tech._id, at: resolvedAt });
      completed += 1;

      const complaint = await Complaint.create(doc);
      await Maintenance.create({
        elevator: elevator._id, type: severity === 'critical' ? 'emergency' : 'corrective',
        title: `Repair: ${category.replace(/_/g, ' ')} (${complaint.complaintId})`,
        scheduledDate: resolvedAt, technician: tech._id, status: 'completed',
        servicedComponents: [{ component: category, action: replaced ? 'replaced' : 'repaired', note: doc.repairNotes }],
        notes: doc.repairNotes, cost: between(1800, 18500), relatedComplaint: complaint._id,
        startedAt: doc.assignedAt, completedAt: resolvedAt, createdBy: admin._id, createdAt: resolvedAt,
      });
    } else {
      await Complaint.create(doc);
    }
  }

  // ---- Planned and preventive maintenance ----
  let tIndex = 0;
  for (const elevator of elevators) {
    const visits = elevator.elevatorId === 'ELV-1007' ? [150] : [150, 62];
    for (const ago of visits) {
      const tech = techs[tIndex % techs.length];
      tIndex += 1;
      const when = daysAgo(ago);
      const serviced = PREVENTIVE_COMPONENTS.map((c) => ({ ...c }));
      if (elevator.elevatorId === 'ELV-1003') serviced[0] = { component: 'door_system', action: 'adjusted', note: 'Door operator belt tension adjusted' };
      await Maintenance.create({
        elevator: elevator._id, type: 'preventive', title: 'Quarterly preventive maintenance', scheduledDate: when, technician: tech._id,
        status: 'completed', plannedComponents: PREVENTIVE_COMPONENTS.map((c) => c.component), servicedComponents: serviced,
        notes: 'Routine inspection and lubrication completed. No abnormalities beyond items logged as complaints.',
        cost: between(4500, 8200), recurrenceDays: 90, startedAt: when, completedAt: new Date(when.getTime() + 4 * HOUR), createdBy: admin._id, createdAt: daysAgo(ago + 14),
      });
    }
  }
  for (const idx of [0, 3, 7]) {
    const when = daysAgo(30 + idx);
    await Maintenance.create({
      elevator: elevators[idx]._id, type: 'inspection', title: 'Monthly safety inspection', scheduledDate: when, technician: techs[2]._id, status: 'completed',
      plannedComponents: ['safety_brake'], servicedComponents: [{ component: 'safety_brake', action: 'inspected', note: 'Governor and safety gear tested' }],
      notes: 'Safety circuit and governor tested. All within limits.', cost: 1500, startedAt: when, completedAt: new Date(when.getTime() + 2 * HOUR), createdBy: admin._id,
    });
  }

  const upcoming = [
    [0, 'preventive', 'Quarterly preventive maintenance', daysAhead(3), 0, ['door_system', 'cables_ropes', 'motor_drive', 'safety_brake', 'control_panel'], 90, 'scheduled'],
    [3, 'preventive', 'Quarterly preventive maintenance', daysAhead(6), 3, ['door_system', 'cables_ropes', 'motor_drive', 'safety_brake'], 90, 'scheduled'],
    [5, 'preventive', 'Quarterly preventive maintenance', daysAhead(20), 1, ['door_system', 'noise_vibration', 'ventilation'], 90, 'scheduled'],
    [7, 'inspection', 'Rope and safety gear inspection', daysAhead(10), 2, ['cables_ropes', 'safety_brake'], 0, 'scheduled'],
    [1, 'preventive', 'Quarterly preventive maintenance', daysAgo(4), 1, ['leveling', 'door_system', 'motor_drive'], 90, 'scheduled'],
    [4, 'inspection', 'Control board inspection', daysAgo(0), 0, ['control_panel'], 0, 'in_progress'],
  ];
  for (const [ei, type, title, scheduledDate, ti, plannedComponents, recurrenceDays, status] of upcoming) {
    await Maintenance.create({
      elevator: elevators[ei]._id, type, title, scheduledDate, technician: techs[ti]._id, plannedComponents, recurrenceDays, status,
      startedAt: status === 'in_progress' ? new Date() : undefined, createdBy: admin._id,
    });
  }

  // ---- Last service dates ----
  for (const elevator of elevators) {
    const last = await Maintenance.findOne({ elevator: elevator._id, status: 'completed' }).sort({ completedAt: -1 });
    if (last) await Elevator.updateOne({ _id: elevator._id }, { lastServiceDate: last.completedAt });
  }

  const [c, m] = await Promise.all([Complaint.countDocuments(), Maintenance.countDocuments()]);
  console.log(`[seed] Created 1 admin, ${techs.length} technicians, ${users.length} users, ${elevators.length} elevators, ${c} complaints, ${m} maintenance records.`);
  console.log('\nDemo accounts:');
  console.log('  Admin       admin@elevai.com       / Admin@123');
  console.log('  Technician  technician@elevai.com  / Tech@123');
  console.log('  User        user@elevai.com        / User@123');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('[seed] Failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
