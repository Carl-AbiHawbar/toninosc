const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEMP_PASSWORD = process.env.TONINO_TEMP_PASSWORD || 'Tonino123!';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

const branchSlugs = [
  'aley',
  'ashrafieh',
  'baalbak',
  'batroun',
  'betchay',
  'bent-jbeil',
  'bikfaya',
  'bliss',
  'broumana',
  'chtoura',
  'cola',
  'dahye',
  'dekwaneh',
  'dhour-chweir',
  'furn-el-chebbak',
  'jal-dib',
  'jbeil',
  'kaslik',
  'khaldeh',
  'mansourieh',
  'mazraat-yachouh',
  'nabatieh',
  'rayfoun',
  'saida',
  'sour',
  'sour-chabriha-rd',
  'zahle',
  'zgharta',
  'zouk-mosbeh',
  'qartaba',
  'city-mall',
  'kfardebian',
];

const systemUsers = [
  { username: 'admin', role: 'admin', fullName: 'Admin' },
  { username: 'warehouse', role: 'warehouse', fullName: 'Warehouse' },
  { username: 'finance', role: 'finance', fullName: 'Finance' },
  { username: 'driver', role: 'driver', fullName: 'Driver' },
  { username: 'supplier', role: 'supplier', fullName: 'Supplier' },
];

const emailFor = (username) => `${username}@toninocrepes.com`;

async function request(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${text}`);
  }

  return body;
}

async function listUsers() {
  const body = await request('/auth/v1/admin/users?per_page=1000');
  return body.users || [];
}

async function deleteOldToninoUsers() {
  const users = await listUsers();
  const oldUsers = users.filter((user) =>
    /@(toninocrepes\.com|app\.toninocrepes\.com|tonino\.local)$/.test(user.email || '')
  );

  for (const user of oldUsers) {
    await request(`/auth/v1/admin/users/${user.id}`, { method: 'DELETE' });
  }

  return oldUsers.length;
}

async function fetchBranches() {
  const branches = await request('/rest/v1/branches?select=id,slug,name&active=eq.true');
  return new Map(branches.map((branch) => [branch.slug, branch]));
}

async function createUser(seed) {
  const body = await request('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: emailFor(seed.username),
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
        username: seed.username,
        role: seed.role,
      },
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
    }),
  });

  return body;
}

async function upsertProfiles(profiles) {
  await request('/rest/v1/profiles?on_conflict=id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(profiles),
  });
}

async function main() {
  const deleted = await deleteOldToninoUsers();
  const branchMap = await fetchBranches();
  const branchUsers = branchSlugs.map((slug) => {
    const branch = branchMap.get(slug);
    if (!branch) throw new Error(`Missing branch for slug ${slug}`);
    return {
      username: slug,
      role: 'branch_manager',
      fullName: branch.name,
      branchId: branch.id,
    };
  });

  const seeds = [...systemUsers, ...branchUsers];
  const profiles = [];

  for (const seed of seeds) {
    const user = await createUser(seed);
    profiles.push({
      id: user.id,
      username: seed.username,
      auth_email: emailFor(seed.username),
      full_name: seed.fullName,
      role: seed.role,
      branch_id: seed.branchId || null,
      active: true,
    });
  }

  await upsertProfiles(profiles);
  console.log(JSON.stringify({ deleted, created: profiles.length, tempPassword: TEMP_PASSWORD }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
