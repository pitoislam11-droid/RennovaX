/**
 * Privacy policy and terms shown in the app. The app stores also need them at a public URL:
 * publish the same text on your website and put the links in App Store Connect and Play Console.
 *
 * TEMPLATE: replace every [BRACKETED] value and have a UK solicitor review both documents before
 * launch. They describe what the app actually does today; update them when that changes.
 */

export interface LegalDoc {
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}

const COMPANY = '[COMPANY NAME] (company number [NUMBER]), [REGISTERED ADDRESS]';
const CONTACT = '[privacy@yourdomain.co.uk]';
/** Shown in Help & safety. */
export const SUPPORT_EMAIL = '[support@yourdomain.co.uk]';

export const PRIVACY: LegalDoc = {
  title: 'Privacy Policy',
  updated: '[DATE]',
  sections: [
    {
      heading: 'Who we are',
      body: `Rennova is run by ${COMPANY}. We are the controller of your personal data. Contact us at ${CONTACT}.`,
    },
    {
      heading: 'What we collect',
      body:
        'Account: your email address, name, postcode and mobile number.\n' +
        'Projects: your answers about the work, photos and videos you add, your area, postcode and full address.\n' +
        'Contractor businesses: business name and type, services, areas covered, phone number, portfolio, and the documents you send us for verification.\n' +
        'Activity: quotes, messages, call requests, reviews, reports and blocks.',
    },
    {
      heading: 'Who sees what',
      body:
        'Contractors see your first name, your area and postcode district, your project answers and photos. ' +
        'Your full address is shared only with the contractor you choose. Your phone number is shared only with the contractor you choose, or one whose call request you approve. ' +
        'Quotes are visible only to you and the contractor who sent them. Reviews are public and show your first name and area.',
    },
    {
      heading: 'Why we use it (lawful basis)',
      body:
        'To provide the service you ask for (contract): running your account, projects, quotes and messages.\n' +
        'To keep the marketplace safe (legitimate interests): verifying contractors, handling reports, preventing fraud.\n' +
        'To meet legal obligations (legal obligation), such as keeping records we are required to keep.',
    },
    {
      heading: 'Who processes it for us',
      body:
        'Supabase (database, sign-in and file storage), Expo (app updates and notifications), Apple and Google (app distribution). ' +
        'Data is stored in [REGION, e.g. London, UK]. Where a provider transfers data outside the UK, we rely on UK adequacy regulations or the International Data Transfer Agreement.',
    },
    {
      heading: 'How long we keep it',
      body:
        'While your account is open. When you delete your account we delete your profile, contact details, projects, photos and contractor business. ' +
        'Reviews you wrote stay published without your name linked to your account, because they form part of the contractor’s record. [ADD ANY RECORDS YOU MUST KEEP LONGER.]',
    },
    {
      heading: 'Your rights',
      body:
        'You can access, correct, delete or export your data, and object to or restrict how we use it. Delete your account at any time in Profile. ' +
        `For anything else, email ${CONTACT}. You can complain to the Information Commissioner’s Office (ico.org.uk).`,
    },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Terms of Use',
  updated: '[DATE]',
  sections: [
    {
      heading: 'About Rennova',
      body: `Rennova connects homeowners with contractors in the UK. It is run by ${COMPANY}. Rennova is free for homeowners and contractors.`,
    },
    {
      heading: 'We are not a party to your job',
      body:
        'Any agreement for work is between the homeowner and the contractor. Rennova does not carry out work, employ contractors or guarantee their work, prices or availability. ' +
        'Check a contractor’s details and agree the scope, price and payment terms in writing before work starts.',
    },
    {
      heading: 'Verification',
      body:
        'A verified badge means we checked the documents it names (for example ID or an insurance certificate) on the date shown. It is not a guarantee of quality. [DESCRIBE YOUR CHECKS.]',
    },
    {
      heading: 'Your responsibilities',
      body:
        'Give accurate information in projects, quotes, profiles and reviews. Don’t post anything unlawful, abusive, misleading or that you don’t have the right to share. ' +
        'Contractors must hold the qualifications, registrations and insurance their work legally requires.',
    },
    {
      heading: 'Reviews',
      body: 'Only a homeowner who completed a project through Rennova can review the contractor who did it. Reviews must be honest and about that job.',
    },
    {
      heading: 'Reporting and removal',
      body:
        'Report anything that breaks these terms from the menu on any message, profile, review or project. We review reports within 24 hours and may remove content or suspend accounts.',
    },
    {
      heading: 'Liability',
      body:
        'Nothing in these terms limits liability that cannot be limited by law, including your rights as a consumer. [HAVE A SOLICITOR COMPLETE THIS SECTION.]',
    },
    {
      heading: 'Contact',
      body: `Questions about these terms: ${CONTACT}. These terms are governed by the law of England and Wales.`,
    },
  ],
};
