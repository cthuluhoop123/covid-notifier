export interface CaseFilter {
    uuid: string,
    maxDist?: number,
    maxAge?: number,
}

export interface Subscription {
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    postcodeSIDs?: string[]
}

export interface NearCase {
    venue: string,
    address: string,
    suburb: string,
    date: string,
    time: string,
    adviceHTML: string,
    updated: string,
    latlng: [number, number],
    distance: number,
    contact: 'Close' | 'Casual'
}

export interface TransportCase {

}

export interface CasesData {
    nearCases: NearCase[],
    subscription?: Subscription
}