/**
 * Demo mode: after a homeowner publishes, matching contractors send quotes a few seconds later,
 * so the quote-comparison flow can be tried without a second device. Remove when the backend lands.
 */
import { newId } from './reducer';
import type { Contractor, Project, Quote } from './types';

export const DEMO_MODE = true;

const DAY = 24 * 60 * 60 * 1000;

export function demoQuotesFor(project: Project, contractors: Contractor[], now = Date.now()): Quote[] {
  const matching = contractors.filter((c) => c.categories.includes(project.categoryId)).slice(0, 3);
  const pool = matching.length > 0 ? matching : contractors.slice(0, 2);
  const basePrice = 1800 + Math.round(Math.random() * 2400);
  return pool.map((c, i) => ({
    id: newId('q'),
    projectId: project.id,
    contractorId: c.id,
    price: Math.round((basePrice * (0.92 + i * 0.07)) / 10) * 10,
    priceType: i === 2 ? 'site_visit' : 'fixed',
    vatIncluded: true,
    materialsIncluded: project.answers.materials !== 'I will',
    durationDays: 5 + i * 2,
    earliestStart: new Date(now + (10 + i * 6) * DAY).toISOString(),
    warrantyMonths: [12, 24, 36][i] ?? 12,
    included: ['Everything described in your project', 'Protection of floors and furniture', 'Daily tidy and final clean'],
    exclusions: ['Anything not listed in your project'],
    assumptions: 'Based on your answers and photos. Access as described.',
    notes: `Thanks for the detailed project, ${c.name} would be glad to help.`,
    submittedAt: new Date(now + i * 1000).toISOString(),
    status: 'submitted',
    revision: 1,
  }));
}
