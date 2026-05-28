
interface Props {
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function UnitecLogo(_: Props) {

  return (
    <img src="/unitec-logo.png" alt="Unitec Logo" width={300} height={300} />
  )
}
