import { useState, useEffect } from 'react'
import './App.css'
import { type Screen, type HomeTab } from './constants/screens'
import LockScreen from './screens/LockScreen'
import HomeScreen from './screens/HomeScreen'
import MenuScreen from './screens/MenuScreen'
import CashierScreen from './screens/CashierScreen'
import ActivationScreen from './screens/ActivationScreen'
import { checkDeviceHealth, fetchOrders, createOrder, updateOrder, deleteOrder, confirmScoreboardOrder } from './services/api'
import { ScoreboardApprovalModal } from './components/cashier'
import { speak, initTTS } from './utils/tts'

// Module-level: track announced order IDs (ngoài React để tránh re-render issues)
const _announcedIds = new Set<string>()

// Init TTS khi module load
initTTS()

function App() {
  // Check localStorage for activation status on initial load
  const isActivated = typeof window !== 'undefined'
    ? localStorage.getItem('device_activated') === 'true'
    : false

  const [screen, setScreen] = useState<Screen>(isActivated ? 'lock' : 'activation')
  const [homeTab, setHomeTab] = useState<HomeTab>('all')
  const [initialTable, setInitialTable] = useState<string | null>(null)
  const [initialAreaId, setInitialAreaId] = useState<number | undefined>(undefined)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  // Orders state (shared between screens)
  const [orders, setOrders] = useState<any[]>([])

  // Helper to refresh orders
  const refreshOrders = async () => {
    try {
      const data = await fetchOrders();
      // Map Backend Data to Frontend UI Format
      const mapped = data.map((o: any) => ({
        ...o,
        type: (o.orderType === 'dine-in' || o.order_type === 'dine-in' || o.orderType === 'table' || o.order_type === 'table') ? 'table' : 'waiting',
        tableName: o.tableName || (o.tableNumber ? `Bàn ${o.tableNumber}` : ''),
        // Keep other fields
      }));
      setOrders(mapped);

      // === TTS: Phát giọng nói khi có order scoreboard mới ===
      const pendingOrders = mapped.filter((o: any) =>
        (o.orderType === 'scoreboard' || o.order_type === 'scoreboard') && o.status === 'pending-confirm'
      );

      for (const order of pendingOrders) {
        const oid = String(order.id)
        if (!_announcedIds.has(oid)) {
          _announcedIds.add(oid)

          const tableName = order.tableName || order.table_name || `Bàn ${order.tableNumber || ''}`
          const itemTexts = (order.items || []).map((item: any) => {
            const name = item.product?.name || item.productName || item.product_name || 'sản phẩm'
            const qty = item.qty || 1
            return `${qty} ${name}`
          })

          if (itemTexts.length > 0) {
            const text = `${itemTexts.join(', ')} ${tableName}`
            console.log(`🔊 TTS: "${text}" (repeat 2x) → gọi server...`)
            speak(text, { repeat: 2 })
          }
        }
      }

    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  }

  // Poll orders (chạy ở mọi screen để TTS luôn hoạt động)
  useEffect(() => {
    refreshOrders();
    const interval = setInterval(refreshOrders, 5000); // 5s polling
    return () => clearInterval(interval);
  }, [])

  // Re-check activation status & Heartbeat
  useEffect(() => {
    const checkActivation = () => {
      // Check in localStorage (set by api.ts on logout)
      const activated = localStorage.getItem('device_activated') === 'true'

      // If invalid but screen is NOT activation -> Go to Activation
      if (!activated && screen !== 'activation') {
        setScreen('activation')
      }
    }

    // Initial check
    checkActivation()

    // Setup periodic health check (every 15s) if activated
    let healthInterval: any
    const isActivated = localStorage.getItem('device_activated') === 'true'

    if (isActivated) {
      // Run once immediately (async)
      checkDeviceHealth().catch((err) => {
        console.error("Health check failed:", err)
      })

      healthInterval = setInterval(() => {
        checkDeviceHealth().catch(console.error)
      }, 15000)
    }

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', checkActivation)

    return () => {
      window.removeEventListener('storage', checkActivation)
      if (healthInterval) clearInterval(healthInterval)
    }
  }, [screen])

  const pendingScoreboardOrders = orders.filter(o => (o.orderType === 'scoreboard' || o.order_type === 'scoreboard') && o.status === 'pending-confirm');
  const currentPendingScoreboardOrder = pendingScoreboardOrders.length > 0 ? pendingScoreboardOrders[0] : null;

  const renderScreen = () => {
    if (screen === 'activation') {
      return <ActivationScreen onActivated={() => setScreen('lock')} />
    }

    if (screen === 'home') {
      return (
        <HomeScreen
          orders={orders}
          onCreateOrder={(tableLabel, areaId) => {
            setInitialTable(tableLabel || null)
            setInitialAreaId(areaId)
            setSelectedOrder(null)
            setScreen('cashier')
          }}
          onSelectOrder={(order) => {
            setSelectedOrder(order)
            setInitialTable(order.tableName || (order.type === 'table' ? `Bàn ${order.tableNumber}` : null))
            setInitialAreaId(order.areaId)
            setScreen('cashier')
          }}
          onLock={() => setScreen('lock')}
          onMenu={() => setScreen('menu')}
          activeTab={homeTab}
          onTabChange={setHomeTab}
        />
      )
    }

    if (screen === 'menu') {
      return (
        <MenuScreen
          orders={orders}
          onBack={() => setScreen('home')}
          onLock={() => setScreen('lock')}
          activeTab={homeTab}
          onNavigateToTab={(tab) => {
            setHomeTab(tab)
            setScreen('home')
          }}
        />
      )
    }

    if (screen === 'cashier') {
      return (
        <CashierScreen
          orders={orders}
          initialTable={initialTable}
          initialAreaId={initialAreaId}
          initialOrder={selectedOrder}
          onLock={() => {
            setInitialTable(null)
            setInitialAreaId(undefined)
            setSelectedOrder(null)
            setScreen('home')
          }}
          onSaveOrder={async (newOrder: any) => {
            try {
              // Map frontend object to backend payload
              const payload = {
                table_id: newOrder.tableId, // Ensure CashierScreen sets this
                area_id: newOrder.areaId,     // Ensure CashierScreen sets this
                table_name: newOrder.tableName,
                table_number: newOrder.tableNumber,
                order_type: newOrder.status === 'takeaway' ? 'takeaway' : 'dine-in', // Simple mapping
                payment_info: newOrder.paymentInfo,
                customer_count: 1, // Default or pass from FE
                status: newOrder.status || 'dine-in',
                created_at: newOrder.createdAt,
                items: newOrder.items.map((item: any) => ({
                  product_id: item.product.id,
                  qty: item.qty,
                  price: item.product.price,
                  is_time_based: item.isTimeBased,
                  start_time: item.startTime,
                  end_time: item.endTime,
                  note: item.note
                }))
              };

              if (selectedOrder && selectedOrder.id) {
                // Update
                // Important: Backend ID is int, Frontend might use "order-timestamp" for temp
                // If ID is string starting with 'order-', it's new. Otherwise it's existing.
                const isTempId = String(selectedOrder.id).startsWith('order-');
                if (isTempId) {
                  await createOrder(payload);
                } else {
                  await updateOrder(selectedOrder.id, payload);
                }
              } else {
                // Create
                await createOrder(payload);
              }

              // Refresh and go home
              await refreshOrders();
              setScreen('home')
              setHomeTab('all')
              setSelectedOrder(null)

            } catch (e) {
              console.error(e)
              alert('Lỗi lưu đơn hàng: ' + (e as any).message)
            }
          }}
          onDeleteOrder={async () => {
            if (selectedOrder && selectedOrder.id) {
              const isTempId = String(selectedOrder.id).startsWith('order-');
              if (!isTempId) {
                try {
                  await deleteOrder(selectedOrder.id);
                  await refreshOrders();
                } catch (e) {
                  alert('Lỗi xóa đơn: ' + (e as any).message);
                  return;
                }
              }
            }
            setScreen('home')
            setHomeTab('all')
            setSelectedOrder(null)
          }}
        />
      )
    }

    return <LockScreen onLogin={() => setScreen('home')} />
  }

  return (
    <>
      {renderScreen()}
      {currentPendingScoreboardOrder && (
        <ScoreboardApprovalModal
          order={currentPendingScoreboardOrder}
          remainingCount={pendingScoreboardOrders.length - 1}
          onConfirm={async () => {
            try {
              if (!currentPendingScoreboardOrder.id) return
              await confirmScoreboardOrder(currentPendingScoreboardOrder.id)
              await refreshOrders()
            } catch (err: any) {
              alert('Lỗi khi xác nhận order: ' + err.message)
            }
          }}
          onReject={async () => {
            try {
              if (!currentPendingScoreboardOrder.id) return
              await deleteOrder(currentPendingScoreboardOrder.id)
              await refreshOrders()
            } catch (err: any) {
              alert('Lỗi khi từ chối order: ' + err.message)
            }
          }}
        />
      )}
    </>
  )
}

export default App
