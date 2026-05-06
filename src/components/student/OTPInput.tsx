import { useRef, type KeyboardEvent, type ClipboardEvent } from "react"

interface Props {
  value: string[]
  onChange: (value: string[]) => void
}

export function OTPInput({ value, onChange }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/, "").slice(-1)
    const next = [...value]
    next[index] = digit
    onChange(next)
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6)
      .split("")
    const next = Array(6).fill("")
    pasted.forEach((d, i) => (next[i] = d))
    onChange(next)
    const last = Math.min(pasted.length, 5)
    inputs.current[last]?.focus()
  }

  return (
    <div className="flex gap-2">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-12 w-12 rounded-lg border border-gray-300 text-center text-lg font-semibold text-[#1B2770] outline-none transition focus:border-[#1B2770] focus:ring-2 focus:ring-[#1B2770]/20"
        />
      ))}
    </div>
  )
}
