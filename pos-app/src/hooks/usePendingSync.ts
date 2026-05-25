import { useEffect, useState } from 'react'
import { createOrder } from '../services/api'
import { getPendingOrders, removePending, updatePendingStatus } from '../lib/pendingQueue'

export function usePendingSync(token: string) {
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      if (!token) return
      if (!navigator.onLine) return
      void syncNow()
    }, 5000)
    return () => clearInterval(timer)
  }, [token])

  const syncNow = async () => {
    const list = await getPendingOrders()
    if (!list.length) return
    setSyncing(true)
    for (const order of list.filter(o => o.status === 'pending')) {
      try {
        await createOrder(order.payload as any, token)
        await updatePendingStatus(order.orderIdLocal, 'sent')
        await removePending(order.orderIdLocal)
        setLastResult(`Gửi đơn ${order.orderIdLocal} thành công`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
        await updatePendingStatus(order.orderIdLocal, 'error', msg)
        setLastResult(`Gửi đơn ${order.orderIdLocal} lỗi: ${msg}`)
      }
    }
    setSyncing(false)
  }

  return { syncing, lastResult, syncNow }
}
