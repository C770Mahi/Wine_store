import { v4 as uuid } from 'uuid';
import { dbQuery, dbTransaction } from '../../db/client';
import { DEMO_USER_ID } from '../../lib/app-defaults';

export interface AddressInput {
  addressType: string;
  fullName: string;
  mobileNumber: string;
  houseNo: string;
  apartmentName?: string;
  streetArea: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  formattedAddress?: string;
  isDefault?: boolean;
}

type AddressRow = {
  id: string;
  label: string;
  recipient_name: string;
  mobile: string;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: string | number | null;
  longitude: string | number | null;
  is_default: boolean;
  house_no: string | null;
  apartment_name: string | null;
  street_area: string | null;
  formatted_address: string | null;
  google_map_link: string | null;
};

function buildGoogleMapsLink(latitude?: number | null, longitude?: number | null) {
  return latitude != null && longitude != null ? `https://www.google.com/maps?q=${latitude},${longitude}` : null;
}

function buildFormattedAddress(address: {
  houseNo: string;
  apartmentName?: string;
  streetArea: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}) {
  return [
    address.houseNo,
    address.apartmentName,
    address.streetArea,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
    address.country
  ].filter(Boolean).join(', ');
}

function buildPrimaryAddressLine(address: {
  houseNo: string;
  apartmentName?: string;
  streetArea: string;
}) {
  return [address.houseNo, address.apartmentName, address.streetArea].filter(Boolean).join(', ');
}

function mapAddressRow(userId: string, row: AddressRow) {
  const houseNo = row.house_no ?? row.address_line_1 ?? '';
  const apartmentName = row.apartment_name ?? row.address_line_2 ?? '';
  const streetArea = row.street_area ?? row.landmark ?? '';
  const landmark = row.landmark ?? '';
  const latitude = row.latitude == null ? null : Number(row.latitude);
  const longitude = row.longitude == null ? null : Number(row.longitude);
  const formattedAddress = row.formatted_address ?? buildFormattedAddress({
    houseNo,
    apartmentName,
    streetArea,
    landmark,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    country: row.country
  });

  return {
    id: row.id,
    userId,
    label: row.label,
    addressType: row.label,
    recipientName: row.recipient_name,
    fullName: row.recipient_name,
    mobile: row.mobile,
    mobileNumber: row.mobile,
    houseNo,
    apartmentName,
    streetArea,
    landmark,
    city: row.city,
    state: row.state,
    country: row.country,
    pincode: row.pincode,
    latitude,
    longitude,
    isDefault: row.is_default,
    formattedAddress,
    googleMapsLink: row.google_map_link ?? (latitude != null && longitude != null ? buildGoogleMapsLink(latitude, longitude) : ''),
    addressLine1: buildPrimaryAddressLine({ houseNo, apartmentName, streetArea })
  };
}

async function getAddressRowById(id: string, userId: string) {
  const { rows } = await dbQuery<AddressRow>(
    `SELECT id, label, recipient_name, mobile, address_line_1, address_line_2, landmark, city, state, country, pincode,
            latitude, longitude, is_default, house_no, apartment_name, street_area, formatted_address, google_map_link
     FROM addresses
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, userId]
  );

  return rows[0] ?? null;
}

export async function listAddresses(userId = DEMO_USER_ID) {
  const { rows } = await dbQuery<AddressRow>(
    `SELECT id, label, recipient_name, mobile, address_line_1, address_line_2, landmark, city, state, country, pincode,
            latitude, longitude, is_default, house_no, apartment_name, street_area, formatted_address, google_map_link
     FROM addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );

  return rows.map((row) => mapAddressRow(userId, row));
}

export async function createAddress(address: AddressInput, userId = DEMO_USER_ID) {
  const id = uuid();
  const formattedAddress = address.formattedAddress?.trim() || buildFormattedAddress(address);
  const latitude = address.latitude ?? null;
  const longitude = address.longitude ?? null;
  const googleMapLink = buildGoogleMapsLink(latitude, longitude);
  const lineOne = buildPrimaryAddressLine(address);

  await dbTransaction(async (client) => {
    const countResult = await client.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM addresses WHERE user_id = $1', [userId]);
    const shouldBeDefault = address.isDefault || Number(countResult.rows[0]?.count ?? 0) === 0;

    if (shouldBeDefault) {
      await client.query('UPDATE addresses SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1', [userId]);
    }

    await client.query(
      `INSERT INTO addresses (
        id, user_id, label, recipient_name, mobile, address_line_1, address_line_2, landmark, city, state, country, pincode,
        latitude, longitude, is_default, house_no, apartment_name, street_area, formatted_address, google_map_link
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        id,
        userId,
        address.addressType,
        address.fullName,
        address.mobileNumber,
        lineOne,
        address.apartmentName || null,
        address.landmark || null,
        address.city,
        address.state,
        address.country,
        address.pincode,
        latitude,
        longitude,
        shouldBeDefault,
        address.houseNo,
        address.apartmentName || null,
        address.streetArea,
        formattedAddress,
        googleMapLink
      ]
    );
  });

  const row = await getAddressRowById(id, userId);
  if (!row) {
    throw new Error('Address could not be loaded after saving.');
  }

  return mapAddressRow(userId, row);
}

export async function updateAddress(id: string, address: AddressInput, userId = DEMO_USER_ID) {
  const existing = await getAddressRowById(id, userId);
  if (!existing) {
    throw new Error('Address not found');
  }

  const formattedAddress = address.formattedAddress?.trim() || buildFormattedAddress(address);
  const latitude = address.latitude ?? null;
  const longitude = address.longitude ?? null;
  const googleMapLink = buildGoogleMapsLink(latitude, longitude);
  const lineOne = buildPrimaryAddressLine(address);
  const shouldBeDefault = address.isDefault === true || existing.is_default;

  await dbTransaction(async (client) => {
    if (address.isDefault === true) {
      await client.query('UPDATE addresses SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1', [userId]);
    }

    await client.query(
      `UPDATE addresses
       SET label = $1,
           recipient_name = $2,
           mobile = $3,
           address_line_1 = $4,
           address_line_2 = $5,
           landmark = $6,
           city = $7,
           state = $8,
           country = $9,
           pincode = $10,
           latitude = $11,
           longitude = $12,
           is_default = $13,
           house_no = $14,
           apartment_name = $15,
           street_area = $16,
           formatted_address = $17,
           google_map_link = $18,
           updated_at = NOW()
       WHERE id = $19 AND user_id = $20`,
      [
        address.addressType,
        address.fullName,
        address.mobileNumber,
        lineOne,
        address.apartmentName || null,
        address.landmark || null,
        address.city,
        address.state,
        address.country,
        address.pincode,
        latitude,
        longitude,
        shouldBeDefault,
        address.houseNo,
        address.apartmentName || null,
        address.streetArea,
        formattedAddress,
        googleMapLink,
        id,
        userId
      ]
    );
  });

  const row = await getAddressRowById(id, userId);
  if (!row) {
    throw new Error('Address not found');
  }

  return mapAddressRow(userId, row);
}

export async function deleteAddress(id: string, userId = DEMO_USER_ID) {
  const existing = await getAddressRowById(id, userId);
  if (!existing) {
    throw new Error('Address not found');
  }

  await dbTransaction(async (client) => {
    await client.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, userId]);

    if (existing.is_default) {
      const nextDefault = await client.query<{ id: string }>(
        `SELECT id
         FROM addresses
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (nextDefault.rows[0]) {
        await client.query('UPDATE addresses SET is_default = TRUE, updated_at = NOW() WHERE id = $1', [nextDefault.rows[0].id]);
      }
    }
  });

  return { id };
}

export async function setDefaultAddress(id: string, userId = DEMO_USER_ID) {
  const existing = await getAddressRowById(id, userId);
  if (!existing) {
    throw new Error('Address not found');
  }

  await dbTransaction(async (client) => {
    await client.query('UPDATE addresses SET is_default = FALSE, updated_at = NOW() WHERE user_id = $1', [userId]);
    await client.query('UPDATE addresses SET is_default = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2', [id, userId]);
  });

  const row = await getAddressRowById(id, userId);
  if (!row) {
    throw new Error('Address not found');
  }

  return mapAddressRow(userId, row);
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
