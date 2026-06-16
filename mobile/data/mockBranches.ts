import { Branch } from '@/types';

export const mockBranches: Branch[] = [
  {
    id: 'branch-1',
    name: 'Tonino Verdun',
    address: 'Verdun Street, Beirut',
    city: 'Beirut',
    countryId: 'country-1',
    phone: '+961 1 234 567',
    managerId: 'user-2',
    isFranchise: false,
  },
  {
    id: 'branch-2',
    name: 'Tonino ABC Ashrafieh',
    address: 'ABC Mall, Ashrafieh',
    city: 'Beirut',
    countryId: 'country-1',
    phone: '+961 1 345 678',
    managerId: 'user-3',
    isFranchise: true,
  },
  {
    id: 'branch-3',
    name: 'Tonino Hamra',
    address: 'Hamra Main Street',
    city: 'Beirut',
    countryId: 'country-1',
    phone: '+961 1 456 789',
    managerId: 'user-4',
    isFranchise: true,
  },
  {
    id: 'branch-4',
    name: 'Tonino Dubai Mall',
    address: 'Dubai Mall, Ground Floor',
    city: 'Dubai',
    countryId: 'country-2',
    phone: '+971 4 123 4567',
    managerId: 'user-5',
    isFranchise: true,
  },
];
