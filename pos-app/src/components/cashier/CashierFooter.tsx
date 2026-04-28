import { HomeIcon } from './CashierIcons'

interface CashierFooterProps {
    userName: string
    timeText: string
    dateText: string
}

/**
 * Shared footer component used in both the main cashier view
 * and the table picker modal. Displays user info, branding, and clock.
 */
export default function CashierFooter({ userName, timeText, dateText }: CashierFooterProps) {
    return (
        <footer className='homeFooter'>
            <div className='homeFooterLeft'>
                <div className='userIcon'>👤</div>
                <span>{userName}</span>
            </div>
            <div className='homeFooterCenter'>
                <HomeIcon />
                <span>AZ POOLARENA</span>
            </div>
            <div className='homeFooterRight'>
                <span className='footerTime'>{timeText}</span>
                <span className='footerDate'>{dateText}</span>
            </div>
        </footer>
    )
}
