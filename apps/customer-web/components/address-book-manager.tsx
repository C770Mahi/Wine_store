'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Address,
  AddressPayload,
  addAddressRequest,
  deleteAddressRequest,
  getAddresses,
  setDefaultAddressRequest,
  updateAddressRequest
} from '@/lib/catalog';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const addressTypeOptions = ['Home', 'Work', 'Apartment', "Parent's House", 'Other'];
const defaultMapCenter = { lat: 12.9716, lng: 77.5946 };

let googleMapsScriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript() {
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured.'));
  }

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in the browser.'));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-google-maps="true"]') as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps.'));
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptPromise;
}

type AddressBookManagerProps = {
  title: string;
  subtitle: string;
  addresses: Address[];
  onAddressesChange: (addresses: Address[]) => void;
  selectedAddressId?: string;
  onSelectAddress?: (addressId: string) => void;
  profileName?: string;
  profileMobile?: string;
  emptyMessage: string;
};

type AddressFormState = AddressPayload;

function createEmptyAddressForm(profileName?: string, profileMobile?: string): AddressFormState {
  return {
    addressType: 'Home',
    fullName: profileName ?? '',
    mobileNumber: profileMobile ?? '',
    houseNo: '',
    apartmentName: '',
    streetArea: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    latitude: null,
    longitude: null,
    formattedAddress: '',
    isDefault: false
  };
}

function buildFormattedAddress(form: AddressFormState) {
  return [
    form.houseNo,
    form.apartmentName,
    form.streetArea,
    form.landmark,
    form.city,
    form.state,
    form.pincode,
    form.country
  ].filter(Boolean).join(', ');
}

function toAddressForm(address: Address): AddressFormState {
  return {
    addressType: address.addressType || address.label || 'Home',
    fullName: address.fullName || address.recipientName || '',
    mobileNumber: address.mobileNumber || address.mobile || '',
    houseNo: address.houseNo || '',
    apartmentName: address.apartmentName || '',
    streetArea: address.streetArea || '',
    landmark: address.landmark || '',
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    formattedAddress: address.formattedAddress,
    isDefault: address.isDefault
  };
}

function getAddressComponent(components: any[], type: string) {
  return components.find((component) => component.types?.includes(type))?.long_name ?? '';
}

function applyPlaceToForm(place: any, current: AddressFormState) {
  const components = place.address_components ?? [];
  const houseNo = getAddressComponent(components, 'street_number') || current.houseNo;
  const apartmentName = getAddressComponent(components, 'premise') || getAddressComponent(components, 'subpremise') || current.apartmentName || '';
  const route = getAddressComponent(components, 'route');
  const neighborhood = getAddressComponent(components, 'sublocality_level_1') || getAddressComponent(components, 'neighborhood');
  const streetArea = [route, neighborhood].filter(Boolean).join(', ') || current.streetArea;
  const landmark = getAddressComponent(components, 'point_of_interest') || getAddressComponent(components, 'establishment') || current.landmark || '';
  const city = getAddressComponent(components, 'locality') || getAddressComponent(components, 'administrative_area_level_2') || current.city;
  const state = getAddressComponent(components, 'administrative_area_level_1') || current.state;
  const country = getAddressComponent(components, 'country') || current.country;
  const pincode = getAddressComponent(components, 'postal_code') || current.pincode;
  const latitude = place.geometry?.location?.lat ? place.geometry.location.lat() : current.latitude;
  const longitude = place.geometry?.location?.lng ? place.geometry.location.lng() : current.longitude;

  const next = {
    ...current,
    houseNo,
    apartmentName,
    streetArea,
    landmark,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
    formattedAddress: place.formatted_address || current.formattedAddress || ''
  };

  if (!next.formattedAddress) {
    next.formattedAddress = buildFormattedAddress(next);
  }

  return next;
}

function formatAddressSummary(address: Address) {
  return address.formattedAddress || [address.addressLine1, address.city, address.state, address.pincode].filter(Boolean).join(', ');
}

export function AddressBookManager({
  title,
  subtitle,
  addresses,
  onAddressesChange,
  selectedAddressId,
  onSelectAddress,
  profileName,
  profileMobile,
  emptyMessage
}: AddressBookManagerProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [form, setForm] = useState<AddressFormState>(() => createEmptyAddressForm(profileName, profileMobile));
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mapError, setMapError] = useState('');
  const [mapsReady, setMapsReady] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const mapRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  const sortedAddresses = useMemo(() => [...addresses].sort((left, right) => Number(right.isDefault) - Number(left.isDefault)), [addresses]);

  const resetMapBindings = () => {
    mapInstanceRef.current = null;
    markerRef.current = null;
    geocoderRef.current = null;
    autocompleteRef.current = null;
    setMapsReady(false);
    setMapError('');
  };

  const resetForm = () => {
    setEditingAddressId('');
    setSearchValue('');
    setForm(createEmptyAddressForm(profileName, profileMobile));
  };

  const refreshAddresses = async (preferredSelectedId?: string) => {
    const nextAddresses = await getAddresses();
    onAddressesChange(nextAddresses);
    if (onSelectAddress) {
      const selectedId = preferredSelectedId || nextAddresses.find((address) => address.id === selectedAddressId)?.id || nextAddresses.find((address) => address.isDefault)?.id || nextAddresses[0]?.id || '';
      onSelectAddress(selectedId);
    }
  };

  useEffect(() => {
    if (!isEditorOpen || !GOOGLE_MAPS_API_KEY) {
      return;
    }

    let cancelled = false;

    void loadGoogleMapsScript()
      .then(() => {
        if (!cancelled) {
          setMapsReady(true);
          setMapError('');
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setMapError(nextError instanceof Error ? nextError.message : 'Unable to load Google Maps.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isEditorOpen]);

  useEffect(() => {
    if (!isEditorOpen || !mapsReady || !mapRef.current || !window.google?.maps) {
      return;
    }

    const googleMaps = window.google.maps;
    const center = {
      lat: typeof form.latitude === 'number' ? form.latitude : defaultMapCenter.lat,
      lng: typeof form.longitude === 'number' ? form.longitude : defaultMapCenter.lng
    };

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new googleMaps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      markerRef.current = new googleMaps.Marker({
        position: center,
        map: mapInstanceRef.current,
        draggable: true
      });

      geocoderRef.current = new googleMaps.Geocoder();

      mapInstanceRef.current.addListener('click', (event: any) => {
        const latitude = event.latLng.lat();
        const longitude = event.latLng.lng();
        markerRef.current.setPosition({ lat: latitude, lng: longitude });
        void reverseGeocode(latitude, longitude);
      });

      markerRef.current.addListener('dragend', (event: any) => {
        const latitude = event.latLng.lat();
        const longitude = event.latLng.lng();
        void reverseGeocode(latitude, longitude);
      });
    } else {
      mapInstanceRef.current.setCenter(center);
      markerRef.current?.setPosition(center);
    }

    if (searchInputRef.current && !autocompleteRef.current && window.google.maps.places) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ['formatted_address', 'geometry', 'address_components', 'name']
      });
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (!place?.geometry?.location) {
          return;
        }

        setSearchValue(place.formatted_address || place.name || '');
        setForm((current) => applyPlaceToForm(place, current));
        const latitude = place.geometry.location.lat();
        const longitude = place.geometry.location.lng();
        mapInstanceRef.current?.setCenter({ lat: latitude, lng: longitude });
        markerRef.current?.setPosition({ lat: latitude, lng: longitude });
      });
    }
  }, [form.latitude, form.longitude, isEditorOpen, mapsReady]);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    if (!geocoderRef.current) {
      setForm((current) => ({
        ...current,
        latitude,
        longitude,
        formattedAddress: current.formattedAddress || buildFormattedAddress(current)
      }));
      return;
    }

    geocoderRef.current.geocode({ location: { lat: latitude, lng: longitude } }, (results: any[], status: string) => {
      if (status === 'OK' && results?.[0]) {
        setSearchValue(results[0].formatted_address || '');
        setForm((current) => applyPlaceToForm({ ...results[0], geometry: { location: { lat: () => latitude, lng: () => longitude } } }, current));
        return;
      }

      setForm((current) => ({
        ...current,
        latitude,
        longitude,
        formattedAddress: current.formattedAddress || buildFormattedAddress(current)
      }));
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Current location is not supported in this browser.');
      return;
    }

    setBusyKey('current-location');
    setMapError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        mapInstanceRef.current?.setCenter({ lat: latitude, lng: longitude });
        markerRef.current?.setPosition({ lat: latitude, lng: longitude });
        void reverseGeocode(latitude, longitude);
        setBusyKey('');
      },
      (nextError) => {
        setMapError(nextError.message || 'Unable to fetch your current location.');
        setBusyKey('');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const openNewAddress = () => {
    resetMapBindings();
    resetForm();
    setIsEditorOpen(true);
    setError('');
    setNotice('');
  };

  const openEditAddress = (address: Address) => {
    resetMapBindings();
    setEditingAddressId(address.id);
    setForm(toAddressForm(address));
    setSearchValue(address.formattedAddress || formatAddressSummary(address));
    setIsEditorOpen(true);
    setError('');
    setNotice('');
  };

  const handleSaveAddress = async () => {
    if (!form.fullName.trim()) {
      setError('Enter the full name for this delivery address.');
      return;
    }
    if (!/^\d{10}$/.test(form.mobileNumber.trim())) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!form.houseNo.trim() || !form.streetArea.trim() || !form.city.trim() || !form.state.trim() || !/^\d{6}$/.test(form.pincode.trim())) {
      setError('Complete the address fields and enter a valid 6-digit pincode.');
      return;
    }
    setBusyKey('save-address');
    setError('');
    setNotice('');

    try {
      const payload: AddressPayload = {
        ...form,
        latitude: typeof form.latitude === 'number' ? form.latitude : null,
        longitude: typeof form.longitude === 'number' ? form.longitude : null,
        formattedAddress: form.formattedAddress?.trim() || buildFormattedAddress(form)
      };
      const savedAddress = editingAddressId
        ? await updateAddressRequest(editingAddressId, payload)
        : await addAddressRequest(payload);

      await refreshAddresses(savedAddress.id);
      setNotice(editingAddressId ? 'Address updated successfully.' : 'Address saved successfully.');
      setIsEditorOpen(false);
      resetMapBindings();
      resetForm();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save the address.');
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteAddress = async (address: Address) => {
    if (!window.confirm(`Delete the ${address.addressType || address.label} address for ${address.fullName || address.recipientName || 'this customer'}?`)) {
      return;
    }

    setBusyKey(`delete:${address.id}`);
    setError('');
    setNotice('');

    try {
      await deleteAddressRequest(address.id);
      await refreshAddresses(selectedAddressId === address.id ? '' : selectedAddressId);
      setNotice('Address deleted successfully.');
      if (editingAddressId === address.id) {
        setIsEditorOpen(false);
        resetMapBindings();
        resetForm();
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to delete the address.');
    } finally {
      setBusyKey('');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setBusyKey(`default:${addressId}`);
    setError('');
    setNotice('');

    try {
      const address = await setDefaultAddressRequest(addressId);
      await refreshAddresses(address.id);
      setNotice('Default address updated.');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to set the default address.');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <article className="card p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-ink sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <button type="button" className="btn-primary min-h-[44px] w-full sm:w-auto" onClick={openNewAddress}>Add new address</button>
      </div>

      {notice ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div> : null}
      {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {isEditorOpen ? (
        <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-bold text-ink">{editingAddressId ? 'Edit address' : 'Add a new address'}</p>
              <p className="text-sm text-muted">Pin the location on Google Maps and save the delivery details.</p>
            </div>
            <button type="button" className="btn-secondary min-h-[44px] w-full sm:w-auto" onClick={() => { setIsEditorOpen(false); resetMapBindings(); resetForm(); }}>Cancel</button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-muted">
              <span>Address type</span>
              <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.addressType} onChange={(event) => setForm((current) => ({ ...current, addressType: event.target.value }))}>
                {addressTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-muted">
              <span>Full name</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm text-muted">
              <span>Mobile number</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.mobileNumber} onChange={(event) => setForm((current) => ({ ...current, mobileNumber: event.target.value.replace(/\D/g, '').slice(0, 10) }))} />
            </label>
            <label className="space-y-2 text-sm text-muted">
              <span>House / Flat number</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.houseNo} onChange={(event) => setForm((current) => ({ ...current, houseNo: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm text-muted">
              <span>Apartment / Building name</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.apartmentName} onChange={(event) => setForm((current) => ({ ...current, apartmentName: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm text-muted">
              <span>Street / Area</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.streetArea} onChange={(event) => setForm((current) => ({ ...current, streetArea: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm text-muted sm:col-span-2">
              <span>Landmark</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.landmark} onChange={(event) => setForm((current) => ({ ...current, landmark: event.target.value }))} />
            </label>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-ink">Google Maps location</p>
                <p className="text-sm text-muted">Search, drag the pin, or use your current location to auto-fill the address. You can also enter the address manually and save without a map pin.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button type="button" className="btn-secondary min-h-[44px] w-full sm:w-auto" onClick={handleUseCurrentLocation} disabled={busyKey === 'current-location'}>
                  {busyKey === 'current-location' ? 'Locating...' : 'Use current location'}
                </button>
                {typeof form.latitude === 'number' && typeof form.longitude === 'number' ? <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`} target="_blank" rel="noreferrer" className="btn-secondary min-h-[44px] w-full sm:w-auto">Open in Maps</a> : null}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <input
                ref={searchInputRef}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink"
                placeholder={GOOGLE_MAPS_API_KEY ? 'Search an address or landmark on Google Maps' : 'Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map search'}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                disabled={!GOOGLE_MAPS_API_KEY}
              />
              <div className="grid gap-3 text-sm text-muted min-[390px]:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><span className="text-xs uppercase tracking-[0.18em] text-brand">Latitude</span><div className="mt-2 font-semibold text-ink">{typeof form.latitude === 'number' ? form.latitude.toFixed(6) : 'Optional'}</div></div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3"><span className="text-xs uppercase tracking-[0.18em] text-brand">Longitude</span><div className="mt-2 font-semibold text-ink">{typeof form.longitude === 'number' ? form.longitude.toFixed(6) : 'Optional'}</div></div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 min-[390px]:col-span-2"><span className="text-xs uppercase tracking-[0.18em] text-brand">Detected address</span><div className="mt-2 font-semibold text-ink break-words">{form.formattedAddress || 'Pick a location on the map to auto-fill this address, or enter it manually below.'}</div></div>
              </div>
              {GOOGLE_MAPS_API_KEY ? (
                <div ref={mapRef} className="h-64 w-full rounded-3xl border border-slate-200 sm:h-72" />
              ) : (
                <div className="rounded-3xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Google Maps is disabled until NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured in the customer web environment. You can still enter and save the address manually.</div>
              )}
              {mapError ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{mapError}</div> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm text-muted">
              <span>City</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm text-muted">
              <span>State</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))} />
            </label>
            <label className="space-y-2 text-sm text-muted">
              <span>Pincode</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.pincode} onChange={(event) => setForm((current) => ({ ...current, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))} />
            </label>
            <label className="space-y-2 text-sm text-muted">
              <span>Country</span>
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
            </label>
          </div>

          <label className="inline-flex items-center gap-3 text-sm font-semibold text-ink">
            <input type="checkbox" checked={form.isDefault ?? false} onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))} />
            Set as default address
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary min-h-[44px] w-full sm:w-auto" onClick={() => void handleSaveAddress()} disabled={busyKey === 'save-address'}>
              {busyKey === 'save-address' ? 'Saving address...' : editingAddressId ? 'Save address' : 'Add address'}
            </button>
          </div>
        </div>
      ) : null}

      {sortedAddresses.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {sortedAddresses.map((address) => {
            const isSelected = selectedAddressId === address.id;
            return (
              <div key={address.id} className={`rounded-3xl border p-4 sm:p-5 ${isSelected ? 'border-brand bg-brand-soft/40' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold text-ink">{address.addressType || address.label}</p>
                      {address.isDefault ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Default</span> : null}
                      {isSelected ? <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">Selected</span> : null}
                    </div>
                    <p className="mt-3 font-semibold text-ink">{address.fullName || address.recipientName}</p>
                    <p className="mt-1 text-sm text-muted break-words">{formatAddressSummary(address)}</p>
                    <p className="mt-1 text-sm text-muted">{address.mobileNumber || address.mobile}</p>
                    {address.googleMapsLink ? <a href={address.googleMapsLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand">View on map</a> : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {onSelectAddress ? <button type="button" className="btn-secondary min-h-[44px] w-full sm:w-auto" onClick={() => onSelectAddress(address.id)}>Select</button> : null}
                    {!address.isDefault ? (
                      <button type="button" className="btn-secondary min-h-[44px] w-full sm:w-auto" onClick={() => void handleSetDefault(address.id)} disabled={busyKey === `default:${address.id}`}>
                        {busyKey === `default:${address.id}` ? 'Updating...' : 'Set default'}
                      </button>
                    ) : null}
                    <button type="button" className="btn-secondary min-h-[44px] w-full sm:w-auto" onClick={() => openEditAddress(address)}>Edit</button>
                    <button type="button" className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 min-h-[44px] w-full sm:w-auto" onClick={() => void handleDeleteAddress(address)} disabled={busyKey === `delete:${address.id}`}>
                      {busyKey === `delete:${address.id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm text-muted">{emptyMessage}</div>
      )}
    </article>
  );
}
