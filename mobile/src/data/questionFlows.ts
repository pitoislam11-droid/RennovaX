/**
 * Guided questionnaires, one flow per category. Kept as data so wording can move to
 * server-delivered, versioned plans later without touching screens.
 */
import type { AnswerValue, CategoryId } from './types';

export type QuestionType = 'single' | 'multi' | 'number' | 'text';

export interface Question {
  id: string;
  title: string;
  help?: string;
  type: QuestionType;
  options?: string[];
  optional?: boolean;
  /** Short label used on the review screen and in the contractor's project view. */
  summaryLabel: string;
  min?: number;
  max?: number;
}

const propertyType: Question = {
  id: 'property_type',
  title: 'What type of property is it?',
  type: 'single',
  options: ['Flat', 'Terraced house', 'Semi-detached house', 'Detached house', 'Bungalow'],
  summaryLabel: 'Property',
};

const occupied: Question = {
  id: 'occupied',
  title: 'Will the property be lived in during the work?',
  help: 'Contractors plan dust protection and working order around this.',
  type: 'single',
  options: ['Yes, furniture stays in place', 'Yes, but rooms can be emptied', 'No, it will be empty'],
  summaryLabel: 'Occupied',
};

const materials: Question = {
  id: 'materials',
  title: 'Who supplies the materials?',
  help: 'Materials can be a third of the price. Knowing this keeps quotes comparable.',
  type: 'single',
  options: ['The contractor', 'I will', 'Not sure yet'],
  summaryLabel: 'Materials',
};

const start: Question = {
  id: 'start',
  title: 'When would you like to start?',
  type: 'single',
  options: ['As soon as possible', 'Within a month', 'In 1–3 months', "I'm flexible"],
  summaryLabel: 'Start',
};

const access: Question = {
  id: 'access',
  title: 'Anything contractors should know about access?',
  help: 'Parking, stairs, lifts, working hours, pets.',
  type: 'text',
  optional: true,
  summaryLabel: 'Access',
};

const SPECIFIC: Record<CategoryId, Question[]> = {
  painting: [
    { id: 'rooms', title: 'How many rooms need doing?', type: 'number', min: 1, max: 20, summaryLabel: 'Rooms' },
    {
      id: 'surfaces',
      title: 'Which surfaces need painting?',
      help: 'Select everything that applies.',
      type: 'multi',
      options: ['Walls', 'Ceilings', 'Doors', 'Skirting boards', 'Window frames', 'Other woodwork'],
      summaryLabel: 'Surfaces',
    },
    { id: 'wallpaper', title: 'Does any wallpaper need removing?', type: 'single', options: ['No', 'Yes, one room', 'Yes, several rooms'], summaryLabel: 'Wallpaper removal' },
    { id: 'damage', title: 'Any cracks or damage?', help: 'Not sure? A close-up photo helps.', type: 'single', options: ['No, surfaces are in good shape', 'A few small hairline cracks', 'Larger cracks, damp or flaking'], summaryLabel: 'Condition' },
  ],
  bathroom: [
    { id: 'scope', title: 'What are you hoping to do?', type: 'single', options: ['Replace the whole bathroom', 'Replace some things, keep others', 'Freshen it up'], summaryLabel: 'Scope' },
    { id: 'fittings', title: 'What should the new bathroom have?', type: 'multi', options: ['Bath', 'Walk-in shower', 'Shower over bath', 'Toilet', 'Basin with vanity', 'Heated towel rail'], summaryLabel: 'Fittings' },
    { id: 'tiling', title: 'How much tiling?', type: 'single', options: ['Floor to ceiling', 'Wet areas only', 'Floor only', 'No tiling'], summaryLabel: 'Tiling' },
    { id: 'moving', title: 'Are any fittings moving position?', type: 'single', options: ['No, same layout', 'Yes, some move', 'Not sure'], summaryLabel: 'Layout' },
  ],
  kitchen: [
    { id: 'scope', title: 'What are you hoping to do?', type: 'single', options: ['Full new kitchen', 'Replace units, keep layout', 'Worktops or doors only'], summaryLabel: 'Scope' },
    { id: 'size', title: 'Roughly how big is the kitchen?', type: 'single', options: ['Small galley', 'Medium', 'Large or open-plan'], summaryLabel: 'Size' },
    { id: 'units', title: 'Who is providing the units?', type: 'single', options: ['I have bought them', 'Contractor to supply', 'Not decided'], summaryLabel: 'Units' },
    { id: 'extras', title: 'Any of these involved?', type: 'multi', options: ['Moving sink or appliances', 'Removing a wall', 'New flooring', 'New lighting'], optional: true, summaryLabel: 'Also' },
  ],
  flooring: [
    { id: 'type', title: 'What flooring would you like?', type: 'single', options: ['Engineered wood', 'Laminate', 'Luxury vinyl tile', 'Carpet', 'Tiles'], summaryLabel: 'Flooring' },
    { id: 'area', title: 'Roughly how many square metres?', help: 'A guess is fine. Photos help contractors check.', type: 'number', min: 1, max: 500, summaryLabel: 'Area (m²)' },
    { id: 'uplift', title: 'Does old flooring need taking up?', type: 'single', options: ['Yes', 'No', 'Not sure'], summaryLabel: 'Uplift' },
  ],
  roofing: [
    { id: 'issue', title: 'What do you need?', type: 'single', options: ['Leak repair', 'Replace some tiles', 'Full re-roof', 'Gutters and fascias', 'Flat roof'], summaryLabel: 'Work' },
    { id: 'storeys', title: 'How many storeys high is the roof?', type: 'single', options: ['1', '2', '3 or more'], summaryLabel: 'Storeys' },
  ],
  plumbing: [
    { id: 'job', title: 'What do you need?', type: 'single', options: ['Leak or repair', 'New radiators', 'Boiler', 'Outside tap', 'Something else'], summaryLabel: 'Job' },
    { id: 'urgency', title: 'How urgent is it?', type: 'single', options: ['Emergency', 'This week', 'No rush'], summaryLabel: 'Urgency' },
  ],
  electrical: [
    { id: 'job', title: 'What do you need?', type: 'single', options: ['Full rewire', 'Extra sockets', 'New lighting', 'Consumer unit', 'EICR certificate'], summaryLabel: 'Job' },
    { id: 'rooms', title: 'How many rooms are involved?', type: 'number', min: 1, max: 20, summaryLabel: 'Rooms' },
  ],
  landscaping: [
    { id: 'work', title: 'What would you like done?', type: 'multi', options: ['Patio', 'Fencing', 'Decking', 'Lawn', 'Planting', 'Garden clearance'], summaryLabel: 'Work' },
    { id: 'size', title: 'How big is the garden?', type: 'single', options: ['Small', 'Medium', 'Large'], summaryLabel: 'Size' },
  ],
  extensions: [
    { id: 'type', title: 'What kind of extension?', type: 'single', options: ['Rear', 'Side return', 'Wraparound', 'Two-storey', 'Not sure yet'], summaryLabel: 'Type' },
    { id: 'plans', title: 'Do you have drawings or planning permission?', type: 'single', options: ['Yes, approved plans', 'Drawings, not approved', 'Not yet'], summaryLabel: 'Plans' },
  ],
  loft: [
    { id: 'type', title: 'What kind of conversion?', type: 'single', options: ['Dormer', 'Velux', 'Hip-to-gable', 'Mansard', 'Not sure'], summaryLabel: 'Type' },
    { id: 'use', title: 'What will the room be used for?', type: 'single', options: ['Bedroom', 'Bedroom with en-suite', 'Office', 'Other'], summaryLabel: 'Use' },
  ],
  general: [
    { id: 'trades', title: 'What does the work involve?', type: 'multi', options: ['Building', 'Plastering', 'Carpentry', 'Painting', 'Plumbing', 'Electrics', 'Not sure'], summaryLabel: 'Involves' },
  ],
};

export function questionsFor(category: CategoryId): Question[] {
  return [propertyType, ...SPECIFIC[category], materials, occupied, start, access];
}

export function isAnswered(q: Question, value: AnswerValue | undefined): boolean {
  if (q.optional) return true;
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value > 0;
}

export function formatAnswer(value: AnswerValue | undefined): string {
  if (value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
