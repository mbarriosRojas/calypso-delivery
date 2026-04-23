'use client'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'

interface Location {
  locationId: string
  name: string
  city: string
  lat: number | null
  lng: number | null
}

interface Trip {
  tripId: string
  status: string
  driver?: { name: string }
  origin: Location
  destination: Location
}

interface Props {
  locations: Location[]
  trips: Trip[]
}

// Leaflet no soporta SSR — se carga solo en cliente
const TripMapInner = dynamic(() => import('./TripMapInner'), { ssr: false })

export function TripMap(props: Props) {
  return (
    <div className="h-80 md:h-96 w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <TripMapInner {...props} />
    </div>
  )
}
