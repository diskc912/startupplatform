// Messages route gets its own layout — no max-width, no padding,
// so the chat UI can stretch edge-to-edge under the navbar.
export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full px-4">{children}</div>
}
