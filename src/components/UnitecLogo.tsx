
interface Props {
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function UnitecLogo({  }: Props) {

  return (
    <img src="/unitec-logo.png" alt="Unitec Logo" width={300} height={300} />
  )
}
