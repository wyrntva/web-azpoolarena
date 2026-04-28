import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'
import { OrderPayload, PendingOrder, PendingStatus } from '../types'

const STORAGE_KEY = 'pending_orders'

localforage.config({
  name: 'pos-app',
  storeName: 'pos_offline',
})

async function readAll(): Promise<PendingOrder[]> {
  const list = await localforage.getItem<PendingOrder[]>(STORAGE_KEY)
  return list ?? []
}

async function writeAll(list: PendingOrder[]) {
  await localforage.setItem(STORAGE_KEY, list)
}

export async function addPendingOrder(payload: OrderPayload) {
  const list = await readAll()
  const record: PendingOrder = {
    orderIdLocal: uuidv4(),
    payload,
    status: 'pending',
    created_at: new Date().toISOString(),
  }
  list.push(record)
  await writeAll(list)
  return record
}

export async function getPendingOrders() {
  return readAll()
}

export async function updatePendingStatus(orderIdLocal: string, status: PendingStatus, error?: string) {
  const list = await readAll()
  const updated = list.map(item =>
    item.orderIdLocal === orderIdLocal
      ? {
          ...item,
          status,
          error,
        }
      : item,
  )
  await writeAll(updated)
}

export async function removePending(orderIdLocal: string) {
  const list = await readAll()
  await writeAll(list.filter(item => item.orderIdLocal !== orderIdLocal))
}
