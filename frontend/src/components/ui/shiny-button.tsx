"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export function ShinyButton({ children, onClick, className = "", ...props }: ShinyButtonProps) {
  return (
    <button className={cn("shiny-cta inline-flex items-center justify-center", className)} onClick={onClick} {...props}>
      <span>{children}</span>
    </button>
  )
}
