interface IconProps {
  className?: string
}

export function SoundIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 8.5c1.8 1.8 1.8 5.2 0 7M18.5 6c3.2 3.2 3.2 8.8 0 12"/></svg>
}

export function MutedIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="m16 10 5 5m0-5-5 5"/></svg>
}

export function SearchIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/></svg>
}

export function CloseIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
}

export function PhoneIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 3.5 10 8 7.8 9.8c1.3 2.8 3.6 5.1 6.4 6.4L16 14l4.5 2.8-.8 3.2c-.2.7-.8 1.1-1.5 1-8-.9-14.3-7.2-15.2-15.2-.1-.7.3-1.3 1-1.5l3.2-.8Z"/></svg>
}

