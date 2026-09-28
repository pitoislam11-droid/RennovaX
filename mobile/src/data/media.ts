/**
 * Demo photography. Replace these with your own images (or storage URLs) before launch.
 * Every image in the app is looked up here so there is one place to swap them.
 */
const u = (id: string, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const MEDIA = {
  onboardingHero: u('photo-1586023492125-27b2c045efd7', 1000),
  livingRoom: u('photo-1586023492125-27b2c045efd7'),
  livingRoom2: u('photo-1618221195710-dd6b41faaea6'),
  livingRoom3: u('photo-1600210492486-724fe5c67fb0'),
  interior4: u('photo-1600566753190-17f0baa2a6c3'),
  apartment: u('photo-1560448204-e02f11c3d0e2'),
  apartment2: u('photo-1502672260266-1c1ef2d93688'),
  kitchen: u('photo-1556911220-bff31c812dba'),
  kitchen2: u('photo-1484154218962-a197022b5858'),
  bathroom: u('photo-1552321554-5fefe8c9ef14'),
  house: u('photo-1600585154340-be6161a56a0c'),
};

/** Shown behind every image while it loads or if it fails. */
export const IMAGE_FALLBACK = '#E9E4DC';
