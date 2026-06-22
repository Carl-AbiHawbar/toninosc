import { Branch } from '@/types';

const branchNames = [
  'Aley',
  'Ashrafieh',
  'Baalbak',
  'Batroun',
  'Betchay',
  'Bent Jbeil',
  'Bikfaya',
  'Bliss',
  'Broumana',
  'Chtoura',
  'Cola',
  'Dahye',
  'Dekwaneh',
  'Dhour Chweir',
  'Furn el Chebbak',
  'Jal Dib',
  'Jbeil',
  'Kaslik',
  'Khaldeh',
  'Mansourieh',
  'Mazraat Yachouh',
  'Nabatieh',
  'Rayfoun',
  'Saida',
  'Sour',
  'Sour Chabriha Rd',
  'Zahle',
  'Zgharta',
  'Zouk Mosbeh',
  'Qartaba',
  'City Mall',
  'Kfardebian',
] as const;

const freeSupplyBranches = new Set(['Bliss', 'Broumana', 'City Mall']);

const managerIds = ['user-2', 'user-3', 'user-4', 'user-5'];

export const mockBranches: Branch[] = branchNames.map((name, index) => {
  const suppliesFree = freeSupplyBranches.has(name);

  return {
    id: `branch-${index + 1}`,
    name: `Tonino ${name}`,
    address: `${name} branch`,
    city: name,
    countryId: 'country-1',
    phone: '+961 70 000 000',
    managerId: managerIds[index % managerIds.length],
    isFranchise: !suppliesFree,
    suppliesFree,
  };
});

export const branchCount = mockBranches.length;
