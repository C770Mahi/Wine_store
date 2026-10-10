import { v4 as uuid } from 'uuid';
import { dbQuery } from '../../db/client';
import { DEMO_USER_ID } from '../../lib/app-defaults';

interface AddressInput {
  label: string;
  recipientName: string;
  mobile: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

export async function listAddresses(userId = DEMO_USER_ID) {
  const { rows } = await dbQuery<{
    id: string;
    label: string;
    recipient_name: string;
    mobile: string;
    address_line_1: string;
    city: string;
    state: string;
    pincode: string;
  }>(
    `SELECT id, label, recipient_name, mobile, address_line_1, city, state, pincode
     FROM addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    userId,
    label: row.label,
    recipientName: row.recipient_name,
    mobile: row.mobile,
    addressLine1: row.address_line_1,
    city: row.city,
    state: row.state,
    pincode: row.pincode
  }));
}

export async function createAddress(address: AddressInput, userId = DEMO_USER_ID) {
  const id = uuid();
  await dbQuery(
    `INSERT INTO addresses (id, user_id, label, recipient_name, mobile, address_line_1, city, state, pincode)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, userId, address.label, address.recipientName, address.mobile, address.addressLine1, address.city, address.state, address.pincode]
  );

  return { id, userId, ...address };
}

export async function checkPincodeServiceability(pincode: string) {
  const { rows } = await dbQuery<{ city: string; legal_age: number; is_serviceable: boolean }>(
    'SELECT city, legal_age, is_serviceable FROM regions WHERE pincode = $1 LIMIT 1',
    [pincode]
  );
  const region = rows[0];

  return {
    pincode,
    isServiceable: Boolean(region?.is_serviceable),
    city: region?.city ?? 'Bangalore',
    legalAge: Number(region?.legal_age ?? 21)
  };
}

export async function checkServiceability(pincode: string) {
  const base = await checkPincodeServiceability(pincode);
  return {
    ...base,
    estimatedEtaMinutes: 18,
    availableSlots: ['10:00-11:00', '11:00-12:00', '18:00-19:00']
  };
}

export async function listNearbyStores() {
  const { rows } = await dbQuery<{ id: string; name: string; city: string; pincode: string }>('SELECT id, name, city, pincode FROM stores WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 10');
  return rows;
}
