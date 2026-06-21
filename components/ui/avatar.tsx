import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  name?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
}

const imageSizeMap = {
  sm: 32,
  md: 40,
  lg: 48,
}

function getInitials(name?: string) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function Avatar({ src, alt, name, size = "md", className, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false)
  const px = imageSizeMap[size]

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2",
        sizeMap[size],
        className
      )}
      {...props}
    >
      {src && !error ? (
        <Image
          src={src}
          alt={alt || name || ""}
          width={px}
          height={px}
          className="size-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span className="font-mono font-medium text-muted">{getInitials(name)}</span>
      )}
    </div>
  )
}

export { Avatar }