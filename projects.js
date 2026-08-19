export const groups = [
  {
    key: 'client',
    label: 'Client Work',
    description: 'Websites delivered for operating businesses, linked directly to the live production experience.'
  },
  {
    key: 'selected',
    label: 'Selected Projects / Experiments',
    description: 'Additional published work shown separately from confirmed Noryx client engagements.'
  }
];

export const projects = [
  {
    index: '01',
    group: 'client',
    featured: true,
    name: 'City Wide Rental',
    location: 'Washington, USA',
    industry: 'Vehicle Rental',
    projectType: 'Business Website / Landing Page',
    description: 'A production website that organizes rental options, weekly pricing and reservation paths into a direct customer experience.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    image: 'assets/projects/citywide-rental.png',
    imageAlt: 'City Wide Rental live website showing weekly rental information and reservation actions',
    url: 'https://citywiderentalwa.com/',
    caseStudy: {
      challenge: 'Present weekly rental options, pricing and reservation information in a way customers could understand quickly.',
      solution: 'A responsive business website that connects fleet discovery, transparent pricing, FAQs and reserve actions in one focused journey.',
      services: ['Website Development', 'Landing Page', 'Responsive Design', 'Deployment', 'Domain Configuration', 'Conversion-Focused Structure']
    }
  },
  {
    index: '02',
    group: 'client',
    name: 'Alfa Cleaning WA',
    location: 'Seattle, Washington, USA',
    industry: 'Cleaning Services',
    projectType: 'Business Website',
    description: 'A local-service website built around service discovery, coverage information and clear quote pathways.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    image: 'assets/projects/alfa-cleaning.png',
    imageAlt: 'Alfa Cleaning live website with Seattle cleaning services and quote actions',
    url: 'https://alfacleaningwa.com/',
    caseStudy: {
      challenge: 'Communicate cleaning services, service areas and quote options clearly to customers across the Seattle market.',
      solution: 'A responsive service website with direct navigation, visible trust information and multiple paths to request a quote.',
      services: ['Business Website', 'Responsive Design', 'Service Architecture', 'Domain Configuration', 'Deployment', 'Website Maintenance']
    }
  },
  {
    index: '03',
    group: 'client',
    name: 'GSN Construction LLC',
    location: 'Seattle, Washington, USA',
    industry: 'Construction & Home Improvement',
    projectType: 'Corporate Website',
    description: 'A professional contractor website presenting service categories, operating areas and direct estimate requests.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    image: 'assets/projects/gsn-construction.png',
    imageAlt: 'GSN Construction LLC live website with home improvement services and estimate request',
    url: 'https://gsnconstructionllc.com/',
    caseStudy: {
      challenge: 'Create a clear public presence for construction services while making it easy for homeowners to understand the offer and request an estimate.',
      solution: 'A structured corporate website combining service presentation, coverage information and strong contact pathways for prospective customers.',
      services: ['Website Development', 'Corporate Website', 'Responsive Design', 'Service Architecture', 'Deployment', 'Estimate Journey']
    }
  },
  {
    index: '01',
    group: 'selected',
    name: 'Família Arretado',
    location: 'Niterói, Rio de Janeiro, Brazil',
    industry: 'Food & Hospitality',
    projectType: 'Restaurant Website',
    description: 'A restaurant experience connecting brand, menu and contact journeys in a cohesive responsive interface.',
    stack: ['WordPress', 'Elementor', 'Responsive UI'],
    image: 'assets/projects/familia-arretado.png',
    imageAlt: 'Família Arretado restaurant website home page',
    url: 'https://familiaarretado.com.br/'
  },
  {
    index: '02',
    group: 'selected',
    name: 'Fairmont Olympic Hotel',
    location: 'Seattle, Washington, USA',
    industry: 'Enterprise Hospitality',
    projectType: 'Selected Web Project',
    description: 'A premium hospitality interface balancing property discovery, editorial presentation and booking actions.',
    stack: ['Adobe AEM', 'Vue', 'Enterprise Web'],
    image: 'assets/projects/fairmont-olympic.png',
    imageAlt: 'Fairmont Olympic Hotel Seattle website home page',
    url: 'https://www.fairmont.com/en/hotels/seattle/fairmont-olympic-hotel.html?code_hotel=A580&goto=fiche_hotel&merchantid=seo-maps-US-A580&sourceid=aw-cen'
  },
  {
    index: '03',
    group: 'selected',
    name: 'Restaurante Veranda',
    location: 'Niterói, Rio de Janeiro, Brazil',
    industry: 'Food & Hospitality',
    projectType: 'Restaurant Website',
    description: 'A content-led website connecting the restaurant atmosphere, menu, delivery and location.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    image: 'assets/projects/restaurante-veranda.png',
    imageAlt: 'Restaurante Veranda website home page',
    url: 'https://restauranteveranda.com.br/'
  }
];
